#!/bin/bash
# Script simples para gerar uma CA e um certificado
openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -days 3650 -out ca.crt -subj "/C=PT/ST=Porto/L=Porto/O=Pwned/CN=LabCA"
