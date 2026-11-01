<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // guests can check out
    }

    public function rules(): array
    {
        return [
            'customer.name' => ['required', 'string', 'min:2', 'max:100'],
            'customer.email' => ['required', 'email', 'max:150'],
            'customer.phone' => ['required', 'regex:/^(\+62|0)8\d{7,12}$/'],
            'customer.address' => ['required', 'string', 'min:8', 'max:255'],
            'customer.province' => ['nullable', 'string', 'max:100'],
            'customer.city' => ['required', 'string', 'max:100'],
            'customer.postal_code' => ['required', 'digits:5'],
            'shipping' => ['required', 'in:regular,express'],
            'items' => ['required', 'array', 'min:1', 'max:30'],
            'items.*.sku' => ['required', 'string'],
            'items.*.color' => ['required', 'string'],
            'items.*.size' => ['required', 'string'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer.phone.regex' => 'Use an Indonesian mobile number, e.g. 0812…',
        ];
    }
}
