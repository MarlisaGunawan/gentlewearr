<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * CMS content stored as key → JSON value.
 */
#[Fillable(['key', 'value'])]
class Setting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['value' => 'array'];
    }

    /** All settings as one array: ['hero' => [...], 'footer' => [...], …]. */
    public static function allAsArray(): array
    {
        return static::all()->mapWithKeys(fn (Setting $s) => [$s->key => $s->value])->all();
    }
}
