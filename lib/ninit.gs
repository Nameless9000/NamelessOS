namelessos_version = "v0.2.8137a"

theme = "parrot"

globals.L = {"c":"<pos=50%>","bc":"<pos=35%>","s":"<s>"}
globals.C = {"g":"<color=green>","r":"<color=red>","G":"<color=#3f3e40>","o":"<color=orange>","p":"<color=purple>","rr":"<color=#FF2222>","lc":"<color=#e0ffff>","e":"</color>","w":"<color=white>","lb":"<color=#25B7DD53>","db":"<color=#209399FF>","c":"<color=#04CBCD>","y":"<color=#F8EB64>"}

globals.Themes = {"parrot":{"bd":C.r,"t":C.o,"p":C.y,"c":C.lc,"o":C.G,"root":C.rr,"user":C.g,"guest":C.p,"other":C.lb,"i":C.e,"s":C.g,"e":C.rr,"it":C.o,"pa":C.o,"ip":C.c}}

globals.t={}

t=Themes[theme]
globals.disable_print = false

globals.Print = function(text)
	if globals.disable_print != true then print(text)
	return text
end function

clear_screen

Print("\n"+t.o+"NamelessOS build "+namelessos_version+C.e+"\n")
Print("\n"+t.o+"NamelessOS Loading..."+C.e)

globals.ar = null

if params.len > 0 then globals.ar = params.join(" ")

globals.config = {"db":server.db,"db_pass":server.pass,"info":true,"deleteLogs":false,"passwdChange":"x"}
globals.rshell = {"ip":server.db,"port":1337,"login":22,"active":false}
globals.proxys = [{"ip":server.db,"password":server.pass}]

rm_dupe = function(list)
    tmp = []
    for item in list
        if typeof(tmp.indexOf(item)) != "number" then tmp.push(item)
    end for
    return tmp
end function

globals.proxys = rm_dupe(globals.proxys)

globals.usr = active_user
if active_user == "root" then globals.usr = "root"
if active_user == "guest" then globals.usr = "guest"
globals.husr = globals.usr
globals.lusr = globals.usr
globals.hs = get_shell()
globals.hc = globals.hs.host_computer
globals.hrouter = get_router()
globals.ls = get_shell()
globals.lc = globals.ls.host_computer
globals.lrouter = get_router()
globals.lip = globals.lc.public_ip
globals.llan = globals.lc.local_ip
globals.shell = get_shell()
globals.path = current_path
globals.comp = globals.shell.host_computer
globals.lan = globals.comp.local_ip
idxp = globals.comp.public_ip
globals.rout = get_router(idxp)
globals.shellType = "shell"
globals.H=[]
