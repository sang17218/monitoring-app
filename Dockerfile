FROM node:18-alpine

# app 
COPY ./app .

RUN npm run build

# prometheus
RUN apk update
RUN apk add curl \
    && curl -LO https://github.com/prometheus/prometheus/releases/download/v3.0.0/prometheus-3.0.0.linux-amd64.tar.gz \
    && tar -xvzf prometheus-3.0.0.linux-amd64.tar.gz \
    && mv prometheus-3.0.0.linux-amd64/prometheus /usr/local/bin/ \
    && mv prometheus-3.0.0.linux-amd64/promtool /usr/local/bin/ \
    && rm -rf prometheus-3.0.0.linux-amd64*
RUN apk add gettext

RUN mkdir -p /etc/prometheus

COPY ./prometheus /etc/prometheus

# grafana
RUN apk add gzip wget
RUN mkdir /grafana
RUN wget -qO /grafana.tar.gz https://dl.grafana.com/oss/release/grafana-11.3.0.linux-amd64.tar.gz 
RUN tar -xzf /grafana.tar.gz --strip-components=1 -C /grafana
RUN rm /grafana.tar.gz

ENV GF_SECURITY_ADMIN_USER=admin
ENV GF_SECURITY_ADMIN_PASSWORD=Admin@123
ENV GF_SERVER_HTTP_PORT=3001
ENV GF_PATHS_PROVISIONING=/etc/grafana/provisioning

# uncomment below to enable AWS sigv4 auth (for aws managed prometheus datasource)
# ENV AWS_SDK_LOAD_CONFIG=true
# ENV GF_AUTH_SIGV4_AUTH_ENABLED=true

COPY ./grafana/datasources.yml /etc/grafana/provisioning/datasources/datasources.yml
COPY ./grafana/dashboards.yml /etc/grafana/provisioning/dashboards/dashboards.yml
COPY ./grafana/dashboards /etc/grafana/provisioning/dashboards

# expose necessary ports and run all
EXPOSE 3000 9090 3001

CMD ["sh", "-c", "prometheus --config.file=/etc/prometheus/prometheus.yml & /grafana/bin/grafana-server --homepath=/grafana & exec node dist/index.js"]


