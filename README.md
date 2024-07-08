# Takhti
A realtime board application in which you can create rooms and join them by thier id.

## Demo
https://github.com/yahyakamran/takhti/assets/98393743/dc0923d5-77d2-476f-92e7-d1f5e82a1ed5

## Build
You need golang and python to run it on any machine
```console
git clone https://github.com/yahyakamran/takhti.git
cd takhti
cd server
go make tidy
go run main.go
cd ..
python3 -m http.server [port]
```

## Dependencies
This project is not dependent on any third party dependency.

## References
Takhti is a word of Urdu language which means a wooden board. From wikipedia "The reed pen has almost disappeared but is still used by young school students in some parts of India and Pakistan, who learn to write with them on small timber boards known as "Takhti"." from [article about pen in which "Takhti" is mentioned](https://en.wikipedia.org/wiki/Pen)
