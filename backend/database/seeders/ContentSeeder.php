<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * Default CMS content for every section of the website. Admins edit it under
 * Website in the backoffice. Seeding again only fills in missing fields, so
 * edits made in the admin panel are kept.
 */
class ContentSeeder extends Seeder
{
    // Media fields left empty ('') fall back to the photos/videos bundled with the website.
    public const DEFAULTS = [
        'site' => [
            'name' => 'Gentle Wear',
            'title' => 'Gentle Wear — The new standard',
            'description' => 'Everyday menswear — tees, shirts, chinos, knitwear and jackets — cut to fit the way you live.',
            'favicon' => '',
            'logo' => '',
        ],
        'navbar' => [
            'links' => [
                ['id' => 'home', 'label' => 'Home', 'visible' => true],
                ['id' => 'collection', 'label' => 'Collection', 'visible' => true],
                ['id' => 'essentials', 'label' => 'Essentials', 'visible' => true],
                ['id' => 'story', 'label' => 'Story', 'visible' => true],
                ['id' => 'lookbook', 'label' => 'Lookbook', 'visible' => true],
                ['id' => 'contact', 'label' => 'Contact', 'visible' => true],
            ],
        ],
        'hero' => [
            'titleWords' => ['The', 'new', 'standard'],
            'description' => 'Gentle Wear makes everyday menswear — tees, shirts, chinos and jackets — cut to fit the way you live, from the office to the weekend.',
            'controllerLabel' => 'Select state →',
            'poster' => '',
            'controls' => [
                ['id' => 'scene', 'label' => 'Scene', 'forward' => '', 'reverse' => ''],
                ['id' => 'light', 'label' => 'Lighting', 'forward' => '', 'reverse' => ''],
                ['id' => 'colorway', 'label' => 'Clothing', 'forward' => '', 'reverse' => ''],
                ['id' => 'fullLook', 'label' => 'Cast', 'forward' => '', 'reverse' => ''],
            ],
        ],
        'featured' => [
            'title' => 'Step into everyday menswear, where every piece fits your day',
            'intro' => 'Honest fabrics, clean cuts and fair prices. Discover a wardrobe that moves with you, from the office to the weekend.',
            'product_skus' => ['gw-101', 'gw-102', 'gw-103', 'gw-104', 'gw-105', 'gw-106'],
            'background' => '',
        ],
        'essentials' => [
            'title' => 'Shop the essentials',
            'product_skus' => ['gw-105', 'gw-141', 'gw-113', 'gw-106'],
        ],
        'editorial' => [
            'tag' => 'collab',
            'overlay' => "Crafted by\nGentle Wear",
            'title' => 'Gentle Wear x Urban Run Club Unveils the Art of Easy Movement!',
            'text' => 'Where every step feels effortless. Our collaboration with Urban Run Club turns your daily commute into a stride of comfort, from the pavement to the coffee shop, built to keep up with you.',
            'action' => 'Start shopping now',
            'image' => '',
        ],
        'lookbook' => [
            'eyebrow' => 'Lookbook · Season 01',
            'title' => 'Five ways to wear Gentle Wear this season',
            'intro' => 'Complete outfits styled by our team. Scroll through the looks, then shop every piece in one tap.',
            'action' => 'View full lookbook',
            'background' => '',
        ],
        'footer' => [
            'title' => 'Everyday menswear, made gently',
            'text' => 'Gentle Wear makes honest basics — tees, shirts, chinos, knitwear and jackets — cut to fit the way you live, from the office to the weekend.',
            'copyright' => '© 2026 Gentle Wear. Made by Marlisa.',
            'instagram' => 'https://www.instagram.com/',
            'tiktok' => 'https://www.tiktok.com/',
            'image' => '',
            'video' => '',
        ],
    ];

    public function run(): void
    {
        foreach (self::DEFAULTS as $key => $defaults) {
            $setting = Setting::find($key);
            // Existing values win; only missing fields get the default.
            $value = array_merge($defaults, $setting?->value ?? []);
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
