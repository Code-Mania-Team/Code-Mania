FROM gcc:13.2.0
WORKDIR /usr/src/app
COPY . .
CMD ["bash", "-c", "g++ program.cpp -o program && ./program"]
