/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-check

/**
 * @param {import('knex')} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('entities', table => {
    table
      .text('data')
      .nullable()
      .comment('The entire JSON data blob of the entity');
  });

  await knex('entities').update({
    // apiVersion and kind should not contain any JSON unsafe chars, and both
    // metadata and spec are already valid serialized JSON
    data: knex.raw(
      `'{"apiVersion":"' || api_version || '","kind":"' || kind || '","metadata":' || metadata || COALESCE(',"spec":' || spec, '') || '}'`,
    ),
  });

  await knex.schema.alterTable('entities', table => {
    table.dropColumn('metadata');
    table.dropColumn('spec');
  });

  // SQLite does not support ALTER COLUMN. Note that we do not use the try/
  // catch method as in other migrations, because if the transaction is
  // partially failed, it will further mess up the already messed-up
  // statement below this.
  if (knex.client.config.client !== 'sqlite3') {
    await knex.schema.alterTable('entities', table => {
      table.text('data').notNullable().alter();
    });
  }

  // NOTE(freben): For some reason, specifically sqlite3 in-mem just drops some
  // subset of constraints sometimes, when a table column is dropped - even if
  // the column had no relation at all to the constraint. We therefore recreate
  // the constraint here as a stupid fix.
  if (knex.client.config.client === 'sqlite3') {
    await knex.schema.alterTable('entities', table => {
      table.unique(['full_name'], 'entities_unique_full_name');
    });
  }
};

/**
 * @param {import('knex')} knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('entities', table => {
    table
      .text('metadata')
      .notNullable()
      .comment('The entire metadata JSON blob of the entity');
    table
      .text('spec')
      .nullable()
      .comment('The entire spec JSON blob of the entity');
    table.dropColumn('data');
  });
};
