# NamelessOS
My hacking tool.

# How to install:

1. save or compile all files in [/lib](https://github.com/Nameless9000/NamelessOS/tree/main/lib) with allow import on
2. rent a server
3. compile [installer.gs](https://raw.githubusercontent.com/Nameless9000/NamelessOS/main/installer.gs)
4. run installer.gs and fill in all inputs
5. wait for it to install and launch nameless os

# How to use

1. you will receive an email with a code, enter that code into the input
2. type 'help' for all commands
3. run 'secure' to secure your pc (you will need to manually secure your network)
4. you can run commands one after the other eg. 'nmap 1.1.1.1;nc -lvnp 1337'
5. you can feed the output of some commands to others eg. 'cat /etc/passwd:grep root:crack'

Remote hacking: 'manual'
Local hacking: 'getsystem'

## Compile manually

1. save or compile all the files in [/lib](https://github.com/Nameless9000/NamelessOS/tree/main/lib) with allow import on
2. rent a server
3. compile this script with values inputted
```lua
globals.ipProtect="ip";
globals.server={"db":"1.1.1.1","pass":"1234"};
globals.email={"user":"x@x.com","password":"1234"};
globals.auth={"pass":"password123","mfaIp"":"123.123.123.123","emailCheck":"x@x.com"};
import_code("/lib/ninit");
import_code("/lib/nlib1");
import_code("/lib/nmain");
```
