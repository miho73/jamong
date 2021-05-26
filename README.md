# 자몽

## 자몽은 여러분의 숙제관리를 도와드립니다.

## 1. PSQL Guide

자몽은 PostgreSQL을 DBMS로 사용합니다. 여기서는 데이터베이스 구조에 대해 설명합니다.

### 1.1. PostgreSQL Setup
> 우선 PostgreSQL 서버를 설치해야 합니다.   
> 아래 명령을 Linux 기반 운영체제의 터미널에서 실행하세요.   
> `sudo apt-get update`   
> `sudo apt-get install postgresql postgresql-contrib`   

### 1.2 USER settings

> |name|value|
> |-|-|
> |host|[DB HOST ADDRESS]|
> |user|jamong|
> |port|5432|
>
> `CREATE USER jamong WITH SUPERUSER;`

### 1.3 Class DB

> Database name: class   
> Table name: class   
> `CREATE DATABASE class OWNER jamong;`

### 1.4 Class information

> Database name: clinf;   
> Table name: <each class's name>   
> `CREATE DATABASE clinf OWNER jamong;`
