<?php

namespace App\Support;

use App\Models\ActivityLog;
use BackedEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

trait RecordsAdminActivity
{
    protected function recordActivity(
        string $action,
        Model|string|null $resource = null,
        string|int|null $resourceId = null,
        array $meta = [],
    ): void {
        $request = app(Request::class);

        if ($resource instanceof Model) {
            $resourceType = $resource::class;
            $resourceIdValue = (string) ($resource->getKey() ?? $resourceId ?? '');
        } elseif (is_string($resource)) {
            $resourceType = $resource;
            $resourceIdValue = $resourceId !== null ? (string) $resourceId : null;
        } else {
            $resourceType = null;
            $resourceIdValue = $resourceId !== null ? (string) $resourceId : null;
        }

        /** @var \App\Models\User|null $user */
        $user = Auth::guard('web')->user() ?? $request->user();

        $safeMeta = [];
        foreach ($meta as $key => $value) {
            if (is_scalar($value) || $value === null) {
                $safeMeta[$key] = $value;
            } elseif ($value instanceof BackedEnum) {
                $safeMeta[$key] = $value->value;
            } elseif (is_array($value)) {
                $safeMeta[$key] = $value;
            }
        }

        try {
            ActivityLog::create([
                'user_id' => $user?->id,
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceIdValue,
                'meta' => $safeMeta ?: null,
                'ip_address' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
            ]);
        } catch (\Throwable) {
            // Never let audit logging failures break the admin action.
        }
    }
}
