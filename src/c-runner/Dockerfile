FROM onboard-python-runner:latest

RUN echo "http://mirrors.aliyun.com/alpine/v3.24/main" > /etc/apk/repositories && \
    echo "http://mirrors.aliyun.com/alpine/v3.24/community" >> /etc/apk/repositories && \
    apk add --no-cache gcc musl-dev

WORKDIR /sandbox

COPY judge.py .
COPY run.py .

CMD ["python3", "judge.py"]
