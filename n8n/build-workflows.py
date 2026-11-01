"""
Builds the three n8n workflow files in ./workflows.
Edit the texts here and run:  python build-workflows.py
(then `npm run import` to load them into n8n).

Telegram goes through the Bot API and email through Brevo, both configured in .env
(no n8n credentials needed).

1. Order paid   — webhook from Laravel → Telegram to admin + thank-you email to the customer
2. Low stock    — webhook from Laravel → Telegram + email to staff
3. Daily recap  — every day 21:00 (Jakarta) → ask Laravel for today's numbers → Telegram + email
"""

import json
import os
import re
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'workflows')


def nid(name):
    # Stable ids, so rebuilding does not create "new" nodes.
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'gentle-wear/' + name))


def webhook(name, path, pos):
    return {
        'id': nid(name), 'name': name, 'type': 'n8n-nodes-base.webhook', 'typeVersion': 2, 'position': pos,
        'webhookId': nid(name + '/hook'),
        'parameters': {'httpMethod': 'POST', 'path': path, 'responseMode': 'onReceived', 'options': {}},
    }


def js(template):
    """'Hi {{ expr }}' (n8n template) -> a JS template literal `Hi ${ expr }`."""
    out = template.replace('`', '\\`').replace('${', '\\${')
    out = re.sub(r'\{\{ (.*?) \}\}', lambda m: '${ ' + m.group(1) + ' }', out)
    return '`' + out + '`'


def post_json(name, url, body, pos, headers=()):
    """HTTP Request node that POSTs `body` (a JS object expression) as JSON."""
    expression = '={{ JSON.stringify(' + body + ') }}'
    assert expression.count('}}') == 1, name  # keep n8n's {{ }} parser happy
    params = {
        'method': 'POST',
        'url': url,
        'sendBody': True,
        'specifyBody': 'json',
        'jsonBody': expression,
        'options': {},
    }
    if headers:
        params['sendHeaders'] = True
        params['headerParameters'] = {'parameters': [{'name': k, 'value': v} for k, v in headers]}
    return {
        'id': nid(name), 'name': name, 'type': 'n8n-nodes-base.httpRequest', 'typeVersion': 4.2, 'position': pos,
        'onError': 'continueRegularOutput',  # a Telegram problem must not stop the email (and back)
        'parameters': params,
    }


def telegram(name, text, pos):
    # Telegram Bot API, token + chat id from .env (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID).
    return post_json(
        name,
        '=https://api.telegram.org/bot{{ $env.TELEGRAM_BOT_TOKEN }}/sendMessage',
        '{ chat_id: $env.TELEGRAM_CHAT_ID, parse_mode: "HTML", text: ' + js(text) + ' }',
        pos,
    )


def email(name, to, subject, html, pos):
    # Brevo transactional email API, key + sender from .env (BREVO_API_KEY, SHOP_EMAIL, SHOP_NAME).
    return post_json(
        name,
        'https://api.brevo.com/v3/smtp/email',
        '{ sender: { name: $env.SHOP_NAME || "Gentle Wear", email: $env.SHOP_EMAIL }, '
        'to: [ { email: ' + js(to) + ' } ], subject: ' + js(subject) + ', htmlContent: ' + js(html) + ' }',
        pos,
        headers=[('api-key', '={{ $env.BREVO_API_KEY }}'), ('accept', 'application/json')],
    )


def workflow(wid, name, nodes, connections):
    return {
        'id': wid, 'name': name, 'active': False, 'nodes': nodes, 'connections': connections,
        'settings': {'executionOrder': 'v1', 'timezone': 'Asia/Jakarta'},
        'pinData': {}, 'tags': [],
    }


def fan_out(source, *targets):
    return {source: {'main': [[{'node': t, 'type': 'main', 'index': 0} for t in targets]]}}


# ── 1. Order paid ──────────────────────────────────────────
HOOK1 = 'Order paid (from Laravel)'
B = "$('" + HOOK1 + "').item.json.body"
order_paid = workflow(
    'gwOrderPaid00001', 'Gentle Wear · Order paid',
    [
        webhook(HOOK1, 'gentle-wear/order-paid', [0, 0]),
        telegram(
            'Tell admin (Telegram)',
            '🛍️ <b>New paid order {{ ' + B + '.order_code }}</b>\n'
            '{{ ' + B + '.customer_name }} · {{ ' + B + '.total_label }}\n\n'
            '{{ ' + B + '.items.join("\\n") }}\n\n'
            '📦 {{ ' + B + '.ship_to }}',
            [260, -100],
        ),
        email(
            'Thank the customer (email)',
            '{{ ' + B + '.customer_email }}',
            'Thank you! Order {{ ' + B + '.order_code }} is confirmed',
            '<div style="font-family:Arial,sans-serif;color:#1f1c19;max-width:520px">'
            '<h2 style="margin:0 0 8px">Thank you, {{ ' + B + '.customer_name }}!</h2>'
            '<p>We received your payment of <b>{{ ' + B + '.total_label }}</b> for order <b>{{ ' + B + '.order_code }}</b>.</p>'
            '<p>{{ ' + B + '.items.join("<br>") }}</p>'
            '<p style="color:#776d64">Shipping to: {{ ' + B + '.ship_to }}</p>'
            '<p>We will email you the tracking number as soon as it ships.<br>— Gentle Wear</p></div>',
            [260, 100],
        ),
    ],
    fan_out(HOOK1, 'Tell admin (Telegram)', 'Thank the customer (email)'),
)

# ── 2. Low stock ───────────────────────────────────────────
HOOK2 = 'Low stock (from Laravel)'
S = "$('" + HOOK2 + "').item.json.body"
low_stock = workflow(
    'gwLowStock000001', 'Gentle Wear · Low stock alert',
    [
        webhook(HOOK2, 'gentle-wear/stock-low', [0, 0]),
        telegram(
            'Alert warehouse (Telegram)',
            '⚠️ <b>Low stock</b>\n{{ ' + S + '.product }} — {{ ' + S + '.color }} {{ ' + S + '.size }}\n'
            'Only <b>{{ ' + S + '.stock }}</b> left (minimum {{ ' + S + '.min_stock }})\nSKU: {{ ' + S + '.sku }}',
            [260, -100],
        ),
        email(
            'Alert warehouse (email)',
            '{{ $env.NOTIFY_EMAIL }}',
            'Low stock: {{ ' + S + '.product }} {{ ' + S + '.color }} {{ ' + S + '.size }} ({{ ' + S + '.stock }} left)',
            '<p>Restock soon:</p><p><b>{{ ' + S + '.product }}</b> — {{ ' + S + '.color }} {{ ' + S + '.size }}<br>'
            'Stock: <b>{{ ' + S + '.stock }}</b> (minimum {{ ' + S + '.min_stock }})<br>SKU: {{ ' + S + '.sku }}</p>',
            [260, 100],
        ),
    ],
    fan_out(HOOK2, 'Alert warehouse (Telegram)', 'Alert warehouse (email)'),
)

# ── 3. Daily recap ─────────────────────────────────────────
SCHEDULE = 'Every day at 21:00'
FETCH = 'Get daily numbers (Laravel)'
R = "$('" + FETCH + "').item.json"
recap_lines = (
    '📊 <b>Daily recap {{ ' + R + '.date }}</b>\n'
    'Orders paid: <b>{{ ' + R + '.orders }}</b>\nRevenue: <b>{{ ' + R + '.revenue_label }}</b>\n'
    'Items sold: {{ ' + R + '.items_sold }}\nWaiting payment: {{ ' + R + '.waiting_payment }}\n\n'
    '🏆 Best sellers\n{{ ' + R + '.top_products.map(p => "• " + p.name + " ×" + p.qty).join("\\n") || "—" }}\n\n'
    '⚠️ Low stock\n{{ ' + R + '.low_stock.join("\\n") || "All good" }}'
)
daily = workflow(
    'gwDailyRecap0001', 'Gentle Wear · Daily sales recap',
    [
        {
            'id': nid(SCHEDULE), 'name': SCHEDULE, 'type': 'n8n-nodes-base.scheduleTrigger', 'typeVersion': 1.2,
            'position': [0, 0],
            'parameters': {'rule': {'interval': [{'field': 'cronExpression', 'expression': '0 21 * * *'}]}},
        },
        {
            # Click "Test workflow" in the editor to send the recap right now.
            'id': nid('manual'), 'name': 'Run now (manual test)', 'type': 'n8n-nodes-base.manualTrigger', 'typeVersion': 1,
            'position': [0, 180], 'parameters': {},
        },
        {
            'id': nid(FETCH), 'name': FETCH, 'type': 'n8n-nodes-base.httpRequest', 'typeVersion': 4.2,
            'position': [240, 0],
            'parameters': {
                'url': '={{ $env.GW_API_URL }}/n8n/daily-summary',
                'sendHeaders': True,
                'headerParameters': {'parameters': [{'name': 'X-N8N-Token', 'value': '={{ $env.GW_N8N_TOKEN }}'}]},
                'options': {},
            },
        },
        telegram('Send recap (Telegram)', recap_lines, [500, -100]),
        email(
            'Send recap (email)',
            '{{ $env.NOTIFY_EMAIL }}',
            'Gentle Wear daily recap {{ ' + R + '.date }} — {{ ' + R + '.revenue_label }}',
            '<div style="font-family:Arial,sans-serif;white-space:pre-line">' + recap_lines.replace('\\n', '<br>') + '</div>',
            [500, 100],
        ),
    ],
    {
        **{SCHEDULE: {'main': [[{'node': FETCH, 'type': 'main', 'index': 0}]]}},
        **{'Run now (manual test)': {'main': [[{'node': FETCH, 'type': 'main', 'index': 0}]]}},
        **fan_out(FETCH, 'Send recap (Telegram)', 'Send recap (email)'),
    },
)

os.makedirs(OUT, exist_ok=True)
for filename, wf in [('order-paid.json', order_paid), ('low-stock.json', low_stock), ('daily-recap.json', daily)]:
    with open(os.path.join(OUT, filename), 'w', encoding='utf-8') as f:
        json.dump(wf, f, indent=2, ensure_ascii=False)
    print('wrote workflows/' + filename)
