<?php
declare(strict_types=1);

namespace Tskn\View;

use PHPTAL;

class HtmlView extends \Pherret\HtmlView {

    protected static $reparse = false;

    public static function setForceReparse($bool = true) {
        static::$reparse = !!$bool;
    }

    public function __toString()
    {
        $tal = new PHPTAL($this->template);
        $tal->setForceReparse(static::$reparse);
        foreach ($this->data as $name => $value) {
            $tal->set($name, $value);
        }
        return $tal->execute();
    }
}