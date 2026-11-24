<?php
/**
 * 数据库建表 DDL（内置，无需手动导入 SQL）
 * 兼容 MySQL 5.7+ / 8.0+
 */

$SCHEMA_SQL = [

    "settings" => "CREATE TABLE IF NOT EXISTS `settings` (
      `k` varchar(64) NOT NULL,
      `v` text,
      PRIMARY KEY (`k`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "events" => "CREATE TABLE IF NOT EXISTS `events` (
      `id` int unsigned NOT NULL AUTO_INCREMENT,
      `name` varchar(191) NOT NULL,
      `event_date` date DEFAULT NULL,
      `remark` text,
      `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "fields" => "CREATE TABLE IF NOT EXISTS `fields` (
      `id` int unsigned NOT NULL AUTO_INCREMENT,
      `event_id` int unsigned NOT NULL DEFAULT 0,
      `field_key` varchar(64) NOT NULL,
      `label` varchar(191) NOT NULL,
      `type` varchar(20) NOT NULL DEFAULT 'text',
      `options` text,
      `sort_order` int NOT NULL DEFAULT 0,
      `visible` tinyint NOT NULL DEFAULT 1,
      `required` tinyint NOT NULL DEFAULT 0,
      `is_system` tinyint NOT NULL DEFAULT 0,
      PRIMARY KEY (`id`),
      KEY `idx_event` (`event_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "records" => "CREATE TABLE IF NOT EXISTS `records` (
      `id` int unsigned NOT NULL AUTO_INCREMENT,
      `event_id` int unsigned NOT NULL,
      `values` longtext,
      `amount` decimal(14,2) DEFAULT NULL,
      `currency` varchar(16) DEFAULT NULL,
      `record_date` date DEFAULT NULL,
      `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      KEY `idx_event` (`event_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
];

/** 默认字段（创建新事件时复制一份） */
function default_fields() {
    return [
        ['field_key'=>'name',        'label'=>'姓名',   'type'=>'text',     'required'=>1, 'visible'=>1, 'is_system'=>1, 'options'=>null],
        ['field_key'=>'relation',    'label'=>'关系',   'type'=>'text',     'required'=>0, 'visible'=>1, 'is_system'=>0, 'options'=>null],
        ['field_key'=>'amount',      'label'=>'金额',   'type'=>'number',   'required'=>1, 'visible'=>1, 'is_system'=>1, 'options'=>null],
        ['field_key'=>'currency',    'label'=>'币种',   'type'=>'select',   'required'=>0, 'visible'=>1, 'is_system'=>0, 'options'=>['CNY','USD','HKD','TWD','EUR','JPY']],
        ['field_key'=>'gift',        'label'=>'礼品',   'type'=>'text',     'required'=>0, 'visible'=>1, 'is_system'=>0, 'options'=>null],
        ['field_key'=>'record_date', 'label'=>'日期',   'type'=>'date',     'required'=>0, 'visible'=>1, 'is_system'=>0, 'options'=>null],
        ['field_key'=>'phone',       'label'=>'电话',   'type'=>'text',     'required'=>0, 'visible'=>0, 'is_system'=>0, 'options'=>null],
        ['field_key'=>'address',     'label'=>'地址',   'type'=>'text',     'required'=>0, 'visible'=>1, 'is_system'=>0, 'options'=>null],
        ['field_key'=>'remark',      'label'=>'备注',   'type'=>'textarea', 'required'=>0, 'visible'=>1, 'is_system'=>0, 'options'=>null],
    ];
}
