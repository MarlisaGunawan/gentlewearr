<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * CMS uploads (hero videos, photos, favicon, logo). Files go to public/uploads/cms
 * and are served from APP_URL/uploads/cms/...
 */
class MediaController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:61440', 'mimes:jpg,jpeg,png,webp,gif,ico,mp4,webm'],
        ]);

        $path = $request->file('file')->store('cms', 'uploads');

        return response()->json(['url' => Storage::disk('uploads')->url($path)], 201);
    }
}
