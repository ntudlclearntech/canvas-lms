#!/bin/bash

#Location
cd /var/canvas/config

#Configuration: you can modified here yourself or just use as default

#delayed_jobs
{
	printf 'development:\n'
	printf '  workers:\n'
	printf '  - queue: canvas_queue\n'
	printf '    workers: 2\n'
	printf '    max_priority: 10\n'
	printf '  - queue: canvas_queue\n'
	printf '    workers: 4\n'
} > delayed_jobs.yml

#domain
{
	printf 'development:\n'
	printf '  domain: "localhost:3000"\n'
} > domain.yml

#redis
{
	printf 'development:\n'
	printf '  servers:\n'
	printf '    - redis//localhost\n' #default port will be 6379
	printf '  database: 1\n'
} > redis.yml

#file_store
{
	printf 'development:\n'
	printf '  storage: local\n'
	printf '  path_prefix: tmp/files\n'
} > file_store.yml

#security
{
	printf 'development:\n'
	printf '  encryption_key: 12345678910abcdefghijklmnopqrstu\n'
} > security.yml

#cache_store
{
	printf 'development:\n'
	printf '  cache_store: redis_store\n'
} > cache_store.yml

#database
{
	printf 'development:\n'
	printf '  adapter: postgresql\n'
	printf '  encoding: utf8\n'
	printf '  database: canvas_development\n'
	printf '  timeout: 5000\n'
	printf '  username: canvas\n'
	printf '  password: canvas\n'
	printf '  host: localhost\n'
} > database.yml
