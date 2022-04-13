<?php
declare(strict_types=1);

namespace Tskn\Model;

class Log extends \Pherret\Model
{
    const TABLE = 'log';
    const DATE_FORMAT = \DateTime::RFC3339;

    public $date;
    public $ip;
    public $client;
    public $file;
    public $line;
    public $level;
    public $code;
    public $message;

    /**
     * @param static $instance
     * @param array $values
     */
    protected static function inflate(&$instance, array $values)
    {
        parent::inflate($instance, $values);
        $instance->date = $values['date'];
        $instance->ip = $values['ip'];
        $instance->client = $values['client'];
        $instance->file = $values['file'];
        $instance->line = intval($values['line']);
        $instance->level = $values['level'];
        $instance->code = intval($values['code']);
        $instance->message = $values['message'];
    }

    /**
     * @param static $instance
     * @param array $values
     */
    protected static function deflate($instance, array &$values)
    {
        parent::deflate($instance, $values);
        $values['date'] = $instance->date;
        $values['ip'] = $instance->ip;
        $values['client'] = $instance->client;
        $values['file'] = $instance->file;
        $values['line'] = $instance->line;
        $values['level'] = $instance->level;
        $values['code'] = $instance->code;
        $values['message'] = $instance->message;
    }

    /**
     * @param static $instance
     * @return static
     */
    public static function add($instance)
    {
        $instance->date = (new \DateTime)->format(static::DATE_FORMAT);
        return parent::add($instance);
    }
}