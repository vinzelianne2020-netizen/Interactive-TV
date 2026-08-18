<?php
$envFile = '/var/www/html/.env';
$exampleFile = '/var/www/html/.env.example';

if (file_exists($exampleFile) && !file_exists($envFile)) {
    copy($exampleFile, $envFile);
}

$lines = file_exists($envFile) ? file($envFile, FILE_IGNORE_NEW_LINES) : [];
$kv = [];
$order = [];
foreach ($lines as $raw) {
    if ($raw === '' || ltrim($raw)[0] === '#') {
        $order[] = ['raw' => $raw];
        continue;
    }
    $eq = strpos($raw, '=');
    if ($eq === false) {
        $order[] = ['raw' => $raw];
        continue;
    }
    $k = trim(substr($raw, 0, $eq));
    $v = substr($raw, $eq + 1);
    $v = trim($v);
    if ((strlen($v) >= 2) && (($v[0] === '"' && $v[strlen($v)-1] === '"') || ($v[0] === "'" && $v[strlen($v)-1] === "'"))) {
        $quote = $v[0];
        $inner = substr($v, 1, -1);
        if ($quote === '"') {
            $v = str_replace(['\\"', '\\\\', '\\$'], ['"', '\\', '$'], $inner);
        } else {
            $v = str_replace("\\'", "'", $inner);
        }
    }
    $kv[$k] = $v;
    if (!in_array($k, array_column($order, 'key') ?? [], true)) {
        $order[] = ['key' => $k];
    }
}

$runtimeKeys = [
    'APP_NAME','APP_ENV','APP_DEBUG','APP_URL','APP_TIMEZONE',
    'DB_CONNECTION','DB_HOST','DB_PORT','DB_DATABASE','DB_USERNAME','DB_PASSWORD','DB_SSLMODE',
    'SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY',
    'WEATHER_API_KEY','WEATHER_LAT','WEATHER_LON','WEATHER_CITY',
    'FRONTEND_URL','FRONTEND_URLS','SANCTUM_STATEFUL_DOMAINS','SESSION_DOMAIN','SESSION_SAME_SITE','SESSION_SECURE_COOKIE',
    'LOG_CHANNEL','LOG_LEVEL','SESSION_DRIVER','CACHE_STORE','QUEUE_CONNECTION',
    'TRUSTED_PROXIES',
    'APP_KEY',
];

foreach ($runtimeKeys as $k) {
    $env = getenv($k);
    if ($env !== false && $env !== '') {
        $kv[$k] = $env;
        if (!in_array($k, array_column($order, 'key') ?? [], true)) {
            $order[] = ['key' => $k];
        }
    }
}

if (empty($kv['APP_KEY'])) {
    $newKey = 'base64:' . base64_encode(random_bytes(32));
    $kv['APP_KEY'] = $newKey;
    if (!in_array('APP_KEY', array_column($order, 'key') ?? [], true)) {
        $order[] = ['key' => 'APP_KEY'];
    }
    echo '[write-env] Generated new APP_KEY' . PHP_EOL;
}

function escapeValue($v) {
    $needsQuote = false;
    foreach ([' ', "\t", '"', "'", '$', '#', '\\', '`', "\n"] as $ch) {
        if (strpos($v, $ch) !== false) { $needsQuote = true; break; }
    }
    if ($v === '') $needsQuote = true;
    if (!$needsQuote) return $v;
    $escaped = str_replace(['\\', '"', '$'], ['\\\\', '\\"', '\\$'], $v);
    return '"' . $escaped . '"';
}

$out = '';
$seenKeys = [];
foreach ($order as $entry) {
    if (isset($entry['raw'])) {
        $out .= $entry['raw'] . PHP_EOL;
    } elseif (isset($entry['key'])) {
        $k = $entry['key'];
        if (isset($seenKeys[$k])) continue;
        $seenKeys[$k] = true;
        if (array_key_exists($k, $kv)) {
            $out .= $k . '=' . escapeValue((string)$kv[$k]) . PHP_EOL;
        }
    }
}
foreach ($kv as $k => $v) {
    if (!isset($seenKeys[$k])) {
        $out .= $k . '=' . escapeValue((string)$v) . PHP_EOL;
    }
}

file_put_contents($envFile, $out);
chown($envFile, 'www-data');
chgrp($envFile, 'www-data');
echo '[write-env] Wrote ' . $envFile . PHP_EOL;
