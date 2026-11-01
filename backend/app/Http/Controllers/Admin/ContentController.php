<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * CMS: every editable section of the website. Each admin page sends only its
 * own section (e.g. { "hero": {...} }), so sections are saved independently.
 */
class ContentController extends Controller
{
    public function show()
    {
        return response()->json(Setting::allAsArray());
    }

    public function update(Request $request)
    {
        $sku = ['string', Rule::exists('products', 'sku')];
        // An uploaded file (MediaController) or any link; empty = the bundled default.
        $media = ['nullable', 'string', 'max:500', 'regex:#^(https?://|/)#'];
        $sections = ['home', 'collection', 'essentials', 'story', 'lookbook', 'contact'];

        $data = $request->validate([
            'site' => ['sometimes', 'array'],
            'site.name' => ['required_with:site', 'string', 'max:40'],
            'site.title' => ['required_with:site', 'string', 'max:70'],
            'site.description' => ['required_with:site', 'string', 'max:160'],
            'site.favicon' => $media,
            'site.logo' => $media,

            'navbar' => ['sometimes', 'array'],
            'navbar.links' => ['required_with:navbar', 'array', 'size:6'],
            'navbar.links.*.id' => ['required', 'distinct', Rule::in($sections)],
            'navbar.links.*.label' => ['required', 'string', 'max:20'],
            'navbar.links.*.visible' => ['required', 'boolean'],

            'hero' => ['sometimes', 'array'],
            'hero.controllerLabel' => ['required_with:hero', 'string', 'max:30'],
            'hero.poster' => $media,
            'hero.controls' => ['required_with:hero', 'array', 'size:4'],
            'hero.controls.*.id' => ['required', 'distinct', Rule::in(['scene', 'light', 'colorway', 'fullLook'])],
            'hero.controls.*.label' => ['required', 'string', 'max:16'],
            'hero.controls.*.forward' => $media,
            'hero.controls.*.reverse' => $media,
            'hero.titleWords' => ['required_with:hero', 'array', 'min:1', 'max:4'],
            'hero.titleWords.*' => ['required', 'string', 'max:20'],
            'hero.description' => ['required_with:hero', 'string', 'max:300'],

            'featured' => ['sometimes', 'array'],
            'featured.title' => ['required_with:featured', 'string', 'max:120'],
            'featured.intro' => ['required_with:featured', 'string', 'max:300'],
            'featured.product_skus' => ['required_with:featured', 'array', 'min:1', 'max:12'],
            'featured.product_skus.*' => $sku,
            'featured.background' => $media,

            'essentials' => ['sometimes', 'array'],
            'essentials.title' => ['required_with:essentials', 'string', 'max:80'],
            'essentials.product_skus' => ['required_with:essentials', 'array', 'min:1', 'max:8'],
            'essentials.product_skus.*' => $sku,

            'editorial' => ['sometimes', 'array'],
            'editorial.tag' => ['required_with:editorial', 'string', 'max:30'],
            'editorial.overlay' => ['required_with:editorial', 'string', 'max:60'],
            'editorial.title' => ['required_with:editorial', 'string', 'max:120'],
            'editorial.text' => ['required_with:editorial', 'string', 'max:500'],
            'editorial.action' => ['required_with:editorial', 'string', 'max:40'],
            'editorial.image' => $media,

            'lookbook' => ['sometimes', 'array'],
            'lookbook.eyebrow' => ['required_with:lookbook', 'string', 'max:60'],
            'lookbook.title' => ['required_with:lookbook', 'string', 'max:120'],
            'lookbook.intro' => ['required_with:lookbook', 'string', 'max:300'],
            'lookbook.action' => ['required_with:lookbook', 'string', 'max:40'],
            'lookbook.background' => $media,

            'footer' => ['sometimes', 'array'],
            'footer.title' => ['required_with:footer', 'string', 'max:100'],
            'footer.text' => ['required_with:footer', 'string', 'max:300'],
            'footer.copyright' => ['required_with:footer', 'string', 'max:100'],
            'footer.instagram' => ['nullable', 'url', 'max:200'],
            'footer.tiktok' => ['nullable', 'url', 'max:200'],
            'footer.image' => $media,
            'footer.video' => $media,
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(Setting::allAsArray());
    }
}
