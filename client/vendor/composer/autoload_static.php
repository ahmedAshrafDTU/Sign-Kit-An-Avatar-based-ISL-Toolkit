<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInit197dc9cbc3096b7994a01310db1475a9
{
    public static $prefixLengthsPsr4 = array (
        'A' => 
        array (
            'Ahmedashrafmahmoud\\Client\\' => 26,
        ),
    );

    public static $prefixDirsPsr4 = array (
        'Ahmedashrafmahmoud\\Client\\' => 
        array (
            0 => __DIR__ . '/../..' . '/src',
        ),
    );

    public static $classMap = array (
        'Composer\\InstalledVersions' => __DIR__ . '/..' . '/composer/InstalledVersions.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInit197dc9cbc3096b7994a01310db1475a9::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInit197dc9cbc3096b7994a01310db1475a9::$prefixDirsPsr4;
            $loader->classMap = ComposerStaticInit197dc9cbc3096b7994a01310db1475a9::$classMap;

        }, null, ClassLoader::class);
    }
}
