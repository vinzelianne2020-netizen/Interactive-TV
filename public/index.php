<?php

if (!str_starts_with((string) ($_SERVER['REQUEST_URI'] ?? ''), '/api')) {
    readfile(__DIR__.'/index.html');
    exit;
}

require __DIR__.'/../backend/public/index.php';
