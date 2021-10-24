namelessos_version = "v0.2.7922a"

theme = "parrot"

singleplayer_mode=false
singleplayer={"db":"108.155.26.81","pass":"Uckeye"}

globals.L = {"c":"<pos=50%>","bc":"<pos=35%>","s":"<s>"}
globals.C = {"g":"<color=green>","r":"<color=red>","G":"<color=#3f3e40>","o":"<color=orange>","p":"<color=purple>","rr":"<color=#FF2222>","lc":"<color=#e0ffff>","e":"</color>","w":"<color=white>","lb":"<color=#25B7DD53>","db":"<color=#209399FF>","c":"<color=#04CBCD>","y":"<color=#F8EB64>"}

globals.Themes = {"parrot":{"bd":C.r,"t":C.o,"p":C.y,"c":C.lc,"o":C.G,"root":C.rr,"user":C.g,"guest":C.p,"other":C.lb,"i":C.e,"s":C.g,"e":C.rr,"it":C.o,"pa":C.o,"ip":C.c}}

globals.t={}

t=Themes[theme]

// Startup

globals.disable_print = false

globals.Print = function(text)
	if globals.disable_print != true then print(text)
	return text
end function

clear_screen()

Print("\n"+t.o+"NamelessOS build "+namelessos_version+C.e+"\n")
Print("\n"+t.o+"NamelessOS Loading..."+C.e)

// Init

globals.logins = {"username":md5("password")}

globals.login = null
globals.config = {"db":"154.71.0.116","db_pass":"15051","info":false,"deleteLogs":false,"passwdChange":"x"}
globals.rshell = {"ip":"72.106.153.174","port":1337,"login":22,"active":false} // songh
globals.proxys = [{"ip":"101.7.165.241","password":"December"},{"ip":"118.156.70.225","password":"96969"}]

globals.ar = null



if params.len == 1 or params.len == 2 then
	globals.login = params[0]
end if

if params.len == 2 then
	globals.ar = params[1]
end if

if singleplayer_mode == true then
	globals.config = {"db":singleplayer.db,"db_pass":singleplayer.pass,"info":true,"deleteLogs":false,"passwdChange":"x"}
	globals.rshell = {"ip":singleplayer.db,"port":1337,"login":22,"active":false}
	globals.proxys = [{"ip":singleplayer.db,"password":singleplayer.pass}]
	globals.login = "username"+":"+md5("password")
end if

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
globals.H=[]

SearchFolder = function(folder, name = "", special = false, output)
	if not folder then return "ERROR_FOLDER_IN_NULL"

	if special then
		for file in folder.get_files
			if file.name.indexOf(name) != null then output.push(trim(file.path))
		end for
	else
		for file in folder.get_files
			if file.name == name then return output.push(trim(file.path))
		end for
	end if
	
	for folder in folder.get_folders
		SearchFolder(folder, name, special, output)
	end for
end function

SearchFFolder = function(folder, name = "", special = false, output)
	if not folder then return "ERROR_FOLDER_IN_NULL"
	if special then
		for file in folder.get_folders
			if file.name.indexOf(name) != null then output.push(trim(file.path))
		end for
	else
		for file in folder.get_folders
			if file.name == name then output.push(trim(file.path))
		end for
	end if
	for folder in folder.get_folders
		SearchFolder(folder, name, special, output)
	end for
end function

FindFile = function(name = "",pc=null)
	if pc == null then pc = globals.shell
	root_folder = null
	if typeof(pc) == "shell" then root_folder = pc.host_computer.File("/")
	if typeof(pc) == "computer" then root_folder = pc.File("/")
	if typeof(pc) == "file" then root_folder = NavToRoot(pc)
	
	if root_folder == null then return "ERROR_ROOT_FOLDER_NOT_OBTAINED"
	output = []
	special = false
	if name.indexOf("*") != null then
		special = true
		name = name.remove("*")
	end if

	if special then
		for file in root_folder.get_files
			if file.name.indexOf(name) != null then output.push(trim(file.path))
		end for
	else
		for file in root_folder.get_files
			if file.name == name then return output.push(trim(file.path))
		end for
	end if

	SearchFolder(root_folder, name, special, output)
	return rm_dupe(output)
end function

FindFolder = function(name = "",pc)
	if not pc then pc = globals.shell
	if typeof(pc) == "shell" then pc = pc.host_computer
	if typeof(pc) != "computer" then return "ERROR_COMPUTER_NOT_PROVIDED"
	root_folder = pc.File("/")
	if not root_folder then return "ERROR_ROOT_FOLDER_NOT_OBTAINED"
	output = []
	special = false
	if name.indexOf("*") != null then
		special = true
		name = name.remove("*")
	end if
	if special then
		for file in root_folder.get_folders
			if file.name.indexOf(name) != null then output.push(trim(file.path))
		end for
	else
		for file in root_folder.get_folders
			if file.name == name then return output.push(trim(file.path))
		end for
	end if
	
	SearchFFolder(root_folder, name, special, output)
	return rm_dupe(output)
end function

ScanFolder = function(folder, depth, output)
	for f in folder.get_files + folder.get_folders
		output.push(" "*depth + f.name + " "+f.permissions)
		ScanFolder(f, depth + 2, output)
	end for
end function

ScanComputer = function(computer)
	if typeof(computer) == "shell" then computer = computer.host_computer
	if typeof(computer) != "computer" then return
	output = []
	root_folder = computer.File("/")
	if not root_folder then return
	output.push(root_folder.name + " " + root_folder.permissions)
	ScanFolder(root_folder,2,output)
	return output
end function

loginCheck = function(user,pass)
	if globals.login then
		sp = globals.login.split(":")
		if sp.len == 2 then
			user = sp[0]
			pass = sp[1]
			for login in globals.logins
				if login.key == user then
					if login.value == pass then
						return true
					end if
				end if
			end for
		end if
	end if
	if pass then
		for login in globals.logins
			if login.key == user then
				if login.value == pass then
					globals.login = user+":"+pass
					return true
				end if
			end if
		end for
	else
		if user then
			for login in globals.logins
				if login.key == user then
					return true
				end if
			end for
		end if
	end if
	return false
end function

// Login

Print(t.o+"NamelessOS Loaded!\n\n"+C.e)

if not loginCheck then
	Print(+t.t+"<b>Login:</b>")
	user = user_input(L.c+t.it+"	Username: "+t.i)
	pass = md5(user_input(L.c+t.it+"	Password: "+t.i,1))
	if loginCheck(user,pass) == false then
		Print(t.e+L.c+"<b>Invalid username &/or password!")
		wait(0.5)
		exit(clear_screen())
	else
		Print("\n"+t.s+L.c+"<i>Welcome to NamelessOS, <b>"+t.user+user)
		wait(0.5)
		clear_screen()
	end if
end if

// Main

wlsys = function(shhell)
	if globals.config.deleteLogs == true then
		log = shhell.host_computer.File("/var/system.log")
		if not log == null then
			log.delete
		end if
	end if
	log = hs.host_computer.File("/var/system.log")
	if not log == null then
		log.delete
	end if
end function

securesys = function(shhell)
	pwd = shhell.host_computer.File("/etc/passwd")
	if not pwd == null and pwd.has_permission("r") and pwd.has_permission("w") then
		con = pwd.get_content
		lines = con.split("\n")
		nc = ""
		sep = ""
		for line in lines
			lsp = line.split(":")
			if lsp.len >= 2 then
				user = lsp[0]
				hash = lsp[1]
				nc=nc+sep+ user+":"+md5(hash)
				sep = "\n"
			end if
		end for
		
		pwd.set_content(nc)
	end if

	sshd = shhell.host_computer.File("/server/conf/sshd.conf")
	if sshd and sshd.has_permission("w") then
		t = "{""encryption_enabled"": true,\n""message_encrypted_conn"": true,\n""path_enc"": ""/server/encode.src"",\n""path_dec"": ""/server/decode.bin""\n}"
		sshd.set_content(t)
	end if

	gues = shhell.host_computer.File("/home/guest")
	if not gues == null then
		gues.delete
	end if

	crypt = shhell.host_computer.File("/lib/crypto.so")
	if not crypt == null then
		crypt.move("/root","crypto.so")
	end if

	home = shhell.host_computer.File("/home")
	if not home == null then
		for user in home.get_folders
			if user.name == "root" then
				for file in user.get_files
					file.move("/root",file.name)
				end for

				for folder in user.get_folders
					for file in folder.get_files
						file.move("/root/"+folder.name,file.name)
					end for
				end for

				user.delete
			else
				for file in user.get_files
					file.move("/root",file.name)
				end for

				for folder in user.get_folders
					if folder.name == "Desktop" then
						for file in folder.get_files
							if file.name != "Terminal" then
								file.move("/root/"+folder.name,file.name)
							end if
						end for
					else
						for file in folder.get_files
							file.move("/root/"+folder.name,file.name)
						end for
					end if
				end for
			end if
		end for
	end if

	wlsys(shhell)

	shhell.host_computer.File("/").set_owner("root",1)
	shhell.host_computer.File("/").set_group("root",1)
	shhell.host_computer.File("/").chmod("o-wrx",1)
	shhell.host_computer.File("/").chmod("u-wrx",1)
	shhell.host_computer.File("/").chmod("g-wrx",1)
	
	shhell.host_computer.File("/bin/sudo").chmod("g+x")
	shhell.host_computer.File("/usr/bin/Terminal.exe").chmod("g+x")
end function

globals.db_shell = get_shell.connect_service(globals.config.db,22,"root",globals.config.db_pass)
clear_screen
log = hs.host_computer.File("/var/system.log")
if not log == null then
	log.delete
end if
securesys(db_shell)
globals.db_pc = globals.db_shell.host_computer
globals.db_ip = globals.config.db


NOS = db_pc.File("/nos")
upd = db_pc.File("/nos/upd.txt")
nos = db_pc.File("/nos/x")
if NOS then
	if upd and upd.get_content then
		if upd.get_content != namelessos_version then
			Print(t.t+"<b>Update Found.</b>")
			if nos == null then exit("Update error, file not found!")

			nos_c = globals.hc.File(program_path)
			Print(t.o+"Updating...")
			x = globals.db_shell.scp("/nos/x", "/root", globals.hs)
			if(x == 1) then
				Print(t.s+"Updated successfully!")
				Print(t.o+"Restarting...")
				nos_n = globals.hc.File("/root/x")
				nos_n.move(nos_c.parent.path,nos_c.name)
				globals.hs.launch(program_path,globals.login)
			else
				exit(x)
			end if
		end if
	end if
end if

uparse = function(ur)
	if ur == "root" then return t.root+"root"
	if ur == "guest" then return t.guest+"guest"
	if ur == "?" then return t.other+"secured"
	return t.user+ur
end function

pparse = function(pat)
	ret = pat

	ret = ret.replace("/root","~")
	ret = ret.replace("/home/"+globals.usr,"~")

	return ret
end function

globals.ppath = pparse(path)

getUser = function(computer,isF)
	su = "?"
	if not isF then
		if computer.File("/") then
			for folder in computer.File("/").get_folders

				if folder.path == "/home" then
					for user in folder.get_folders
						if user.has_permission("w") then
							if su != "root" then
								if user.group == "guest" then
									if su != "guest" then
										su = user.group
									else
										su = "guest"
									end if
								end if
							end if
						end if
					end for
				end if

				if folder.path == "/boot" then
					if folder.has_permission("w") then
						su = folder.group
					end if
				end if
			end for

			dirs = findUnlockedDirs(computer.File("/"),[])
			if dirs.len > 0 then
				ddir = null
				for dir in dirs
					if dir.has_permission("w") then ddir = dir
					if dir.has_permission("w") and dir.has_permission("x") then ddir = dir
					if dir.has_permission("w") and dir.has_permission("r") then ddir = dir
					if dir.has_permission("w") and dir.has_permission("r") and dir.has_permission("x") then ddir = dir
					if dir.parent.name == "." then ddir = dir.parent
				end for

				mkd = globals.comp.create_folder(ddir.path, ".")
				if mkd == 1 then
					dir = globals.comp.File(ddir.path+"/.")
					su = dir.owner
					dir.delete
				end if
			end if
		end if	
	else
		if computer.path == "/" then
			for folder in computer.get_folders

				if folder.path == "/home" then
					for user in folder.get_folders
						if user.has_permission("w") then
							if su != "root" then
								if user.group == "guest" then
									if su != "guest" then
										su = user.group
									else
										su = "guest"
									end if
								end if
							end if
						end if
					end for
				end if

				if folder.path == "/boot" then
					if folder.has_permission("w") then
						su = folder.group
					end if
				end if

			end for
		end if
	end if
	return su
end function

getLibFileName = function(metaLib)
	return metaLib.lib_name+"_v"+metaLib.version+".txt"
end function

padSpaces = function(s, l, p = " ")
	if typeof(s) == "number" then s = s+""
	if s.len >= l then return s
	padString = ""
	c = l - s.len
	while c > 0
		padString = padString+p
		c = c - 1
	end while
	return (s+padString)
end function

padSpacesRight = function(s, l, p = " ")
	if typeof(s) == "number" then s = s+""
	if s.len >= l then return s
	padString = ""
	c = l - s.len
	while c > 0
		padString = p+padString
		c = c - 1
	end while
	return (padString+s)
end function


getRouter = function(IPAddress)	
	router = get_router(IPAddress)
	if not router then
		error("Could not find a router at the given address: "+IPAddress)
		return null
	end if
	
	return router
end function

getColorString = function(fileObj)
	if fileObj.has_permission("r") and fileObj.has_permission("w") then return("88FFFF")
	if fileObj.has_permission("r") then return("8888FF")
	if fileObj.has_permission("w") then return("88FF88")
	return("FF8888")
end function

parseSize = function(bytes)
	bytes = bytes.to_int
	i=0
	units = ["B","KB","MB","GB","TB","PT"]
	while bytes > 1024
		bytes=bytes/1024
		i=i+1
	end while
	return round(bytes,2)+units[i]
end function

loadLibrary = function(libFileName, search)
	paths = FindFile(libFileName,globals.hs)
	if search == 2 then paths = FindFile(libFileName)
	for p in paths
		lib = include_lib(p)
		if lib then return lib
	end for
	error("Could not find requested library: "+libFileName)
	return false
end function

findLibrary = function(libFileName, search)
	paths = FindFile(libFileName,globals.hs)
	if search == 2 then paths = FindFile(libFileName)
	for p in paths
		return p
	end for
	error("Could not find requested library: "+libFileName)
	return false
end function

loadMetaXPloit = function()
	return loadLibrary("metaxploit.so", true)
end function

error = function(str)
	Print(t.e+"<b>  ERROR: </b>"+C.e+str)
end function

info = function(str)
	if globals.config.info == false then return null end if
	Print(t.c+"<i>  INFO: "+C.e+str+"</i>")
end function

removeDuplicates = function(exploits)
	index1 = -1
	startCount = exploits.len
	for exploit in exploits
		index1 = index1+1
		index2 = exploits.len -1
		while index2 > index1
			if exploit.memory == exploits[index2].memory and exploit.string == exploits[index2].string then exploits.remove(index2)
			end if
			index2 = index2 - 1
		end while
	end for
	finalCount = exploits.len
	info("Removed "+(startCount-finalCount)+" duplicate items from exploit library.")
	return exploits
end function

get_choice = function(choices, default = -1)
	c = 0
	for choice in choices
		if c == 0 then
			Print("<b>"+t.it+choices[0]+C.e+"</b> ")
		else
			selString = t.it+"<b>["+c+"]</b> "+C.e
			Print(padSpaces(selString, 12)+choices[c])
		end if
		c = c+1
	end for
	if default > -1 then
		prompt = t.it+"<default="+default+C.e+">"+t.p+" $ "+t.i
	else
		prompt = t.p+"$ "+C.e
	end if
	while 1
		user_choice = user_input(prompt)
		if user_choice.len == 0 and default > -1 then return default
		user_choice = user_choice.to_int
		if not typeof(user_choice) == "number" or user_choice < 1 or user_choice >= c then
			error("Not a valid choice")
			continue
		end if
		return user_choice
	end while
end function

get_yesno = function(default, prompt = "")
	if prompt.len > 0 then Print("<b>"+prompt+"</b>")
	if default then
		prompt = t.it+"[Enter=Yes]"+C.e+t.p+" $ "+t.i
	else
		prompt = t.it+"[Enter=No]"+C.e+t.p+" $ "+t.i
	end if
	while 1
		resp = user_input(prompt)
		if resp.len == 0 then return default
		if resp.lower[0] == "y" then return true
		if resp.lower[0] == "n" then return false
	end while
end function


extractMetaLibs = function(router)
	returnValue = []
	
	if typeof(router) == "router" then
		externalPorts = router.used_ports
	else if typeof(router) == "string" then
		externalPorts = globals.rout.device_ports(router)
	end if
	
	metaxploit = loadMetaXPloit()
	
	if typeof(router) == "router" then
		routerLib = metaxploit.net_use(router.public_ip)
		if routerLib != null then
			routerLib = routerLib.dump_lib
		else
			return error("Router is destroyed lol.")
		end if
	else
		routerLib = metaxploit.net_use(globals.rout.public_ip)
		if routerLib != null then
			routerLib = routerLib.dump_lib
		else
			return error("Router is destroyed lol.")
		end if
	end if
	
	if routerLib then
		if typeof(router) == "router" then
			returnValue.push({"public_ip": router.public_ip, "local_ip": router.local_ip, "port_number":-1, "metaLib":routerLib})
		else
			returnValue.push({"public_ip": globals.rout.public_ip, "local_ip": router, "port_number":-1, "metaLib":routerLib})
		end if
	else
		error("Could not map exploit library to router at: "+router.public_ip)
	end if
	
	for port in externalPorts
		metalib = null
		if typeof(router) == "router" then
			metalib = metaxploit.net_use(router.public_ip, port.port_number)
		else
			metalib = metaxploit.net_use(router, port.port_number)
		end if
		if not metalib then continue
		metalib = metalib.dump_lib
		if not metalib then	
			error("Could not map exploit to public port at: "+router.public_ip+":"+port.port_number)
		else
			if typeof(router) == "router" then
				returnValue.push({"public_ip": router.public_ip,"local_ip": port.get_lan_ip, "port_number":port.port_number, "metaLib":metalib})
			else
				returnValue.push({"public_ip": globals.rout.public_ip,"local_ip": port.get_lan_ip, "port_number":port.port_number, "metaLib":metalib})
			end if
		end if
	end for
	
	return returnValue
	
end function


loadExploits = function(metaLib)
	// Loads all the exploits appropriate for
	if typeof(metaLib) == "string" then
		fileName = metaLib
	else
		fileName = getLibFileName(metaLib)
	end if
	
	filePath = "/lib/"
	
	globals.db_pc.touch(filePath, fileName)
	exploitLibFile = globals.db_pc.File(filePath+fileName)
	
	if not exploitLibFile then
		error("Could not find exploit library.")
		return false
	end if
	
	info("Loading library..")
	
	rValue = []
	newKey = false
	lines = exploitLibFile.get_content.split("\n")
	securesys(db_shell)
	info("Library contains " + lines.len + " lines of data.")
	
	for line in lines
		if line.len == 0 then continue
		colsUntrimmed = line.split("::")
		cols = []
		for col in colsUntrimmed
			cols.push(col.trim)
		end for

		if cols.len < 2 then continue
		if cols[0] == "exploit" then
			if newKey then rValue.push(newKey)
			newKey = {"type": cols[1]}
		else if cols[0] == "parameters" or cols[0] == "requirements" then
			newKey[cols[0]] = cols[1:]
		else
			newKey[cols[0]] = cols[1]
		end if
	end for
	if newKey then rValue.push(newKey)
	
	return rValue
end function

writeExploits = function(exploits, metaLib)
	fileName = getLibFileName(metaLib)
	filePath = "/lib/"
	
	globals.db_pc.touch(filePath, fileName)
	file = globals.db_pc.File(filePath+fileName)
	
	outputString = ""
	if not file then
		error("Could not open "+filename+" for output.")
		return false
	end if
	for exploit in exploits
		if exploit.hasIndex("type") then outputString = outputString+"exploit::"+exploit.type+"\n"
		for key in exploit.indexes
			if key == "memory" then outputString = outputString+"     "
			if key == "string" or key == "requirements" then outputString = outputString+"     "
			if key == "parameters" then outputString = outputString+"     "
			outputString = outputString+key
			value = exploit[key]
			if typeof(value) == "string" then
				outputString = outputString+"::"+value
			else if typeof(value) == "list" then
				for val in value
					outputString = outputString+"::"+val
				end for
			else
				error("writeExploits: Don't know what to do with type: "+typeof(value)+" while writing key: "+key)
				return false
			end if
			outputString = outputString+"\n"
		end for
	end for
	file.set_content(outputString)
	securesys(db_shell)
end function

scanTarget = function(target)
	// Scans the target and appends the data to the file as needed.
	
	metaxploit = loadMetaXPloit()
	addresses = metaxploit.scan(target)
	info("Found "+addresses.len+" memory addresses.")
	
	info("Updating library...")
	
	expList = []
	expMap = false
	requirements = false
	for address in addresses
		exploits = metaxploit.scan_address(target, address)
		lines = exploits.split("\n")
		for line in lines
			info("Analyzing: "+line)
			if line.len == 0 then continue
			if line.indexOf("Unsafe check") == 0 then
				if expMap then
					if requirements then
						expMap.push("requirements")
						expMap["requirements"] = requirements
						info("Adding requirements to object")
					end if
					expList.push(expMap)
					info("pushing object: "+expMap)
				end if
				startPos = line.indexOf("<b>")+3
				endPos = line.indexOf("</b>")
				info("Creating new object with keystring: "+line[startPos:endPos])
				expMap = {"exploit":"Unknown", "string":line[startPos:endPos], "memory":address}
				requirements = false
			else if line[0] == "*" then
				if requirements then
					requirements = requirements+"::"+line
					info("Updated requirements: "+requirements)
				else
					info("New requirements set: "+line)
					requirements = line
				end if
			end if
		end for
	end for
	if expMap then
		if requirements then
			expMap.push("requirements")
			expMap["requirements"] = requirements
			info("Adding requirements to object")
		end if
		expList.push(expMap)
		info("pushing object: "+expMap)
	end if
	
	fileName = getLibFileName(target)
	filePath = "/lib/"
	
	globals.db_pc.touch(filePath, fileName)
	exploitLibFile = globals.db_pc.File(filePath+fileName)

	newEntries = ""
	for exp in expList
		if target.lib_name == "kernel_router.so" or "net.so" then exp.exploit = "Router"
		newEntries = newEntries+"exploit::"+exp.exploit+"\n"
		newEntries = newEntries+"     memory::"+exp.memory+"\n"
		newEntries = newEntries+"     string::"+exp.string+"\n"
		if exp.hasIndex("requirements") then newEntries = newEntries+"     requirements::"+exp.requirements+"\n"
		if target.lib_name == "kernel_router.so" or "net.so" then
			newEntries = newEntries+"     parameters::Local IP Address\n"
		end if
	end for
	
	exploitLibFile.set_content(exploitLibFile.get_content+newEntries)
	securesys(db_shell)
	info("library updated.")
	
	writeExploits(removeDuplicates(loadExploits(target)), target)
	
end function

changeExploitType = function(exploitToChange, target, newType)
	info("Updating exploit type from "+exploitToChange.type+" to "+newType)
	newExploit = exploitToChange
	exploitList = loadExploits(target)
	c = -1
	for exploit in exploitList
		c = c+1
		if exploit.memory == exploitToChange.memory and exploit.string == exploitToChange.string then
			if newType.lower == "shell" or newType.lower == "computer" or newType.lower == "file" or newType.lower == "firewall" then
				exploitList[c].type = newType
				info("Changing entry "+c+" to "+newType)
				newExploit = exploitList[c]
			else if newType.lower == "rootpass" or newType.lower == "userpass" then
				if newType.lower == "rootpass" then
					exploitList[c].type = "Change root password"
				else
					exploitList[c].type = "Change user password"
				end if
				if not exploitList[c].hasIndex("parameters") then exploitList[c].push("parameters")
				exploitList[c].parameters = ["New Password"]
				newExploit = exploitList[c]
			end if
		end if
	end for
		
	writeExploits(exploitList, target)
	return newExploit
end function

runExploit = function(exploit, target, lip)
	while 1
		info("\n<b>Applying exploit <i>"+exploit.type+"</i> against target: <i>"+target.lib_name+"</i></b>")
		
		ps = []
		if exploit.hasIndex("parameters") then
			for parameter in exploit.parameters
				if parameter == "Local IP Address" then
					ps.push(lip)
				else if parameter == "New Password" then
					ps.push(globals.config.passwdChange)
				else
					Print("<b>Additional information needed.  Please answer the following questions</b>")
					ps.push(user_input(parameter+" >"))
				end if
			end for
		end if
		

		if ps.len == 0 then
		overflowResult = target.overflow(exploit.memory, exploit.string)
		else if ps.len == 1 then
			overflowResult = target.overflow(exploit.memory, exploit.string, ps[0])
		else if ps.len == 2 then
			overflowResult = target.overflow(exploit.memory, exploit.string, ps[0], ps[1])
		else if ps.len == 3 then
			overflowResult = target.overflow(exploit.memory, exploit.string, ps[0], ps[1], ps[2])
		else
			error("Too many parameters")
			return true
		end if


		
		info("Result is an object of type <i>"+typeof(overflowResult)+"</i>")
		
		if typeof(overflowResult) == "null" then
			choices = [""]
			choices.push("Requirements not met.")
			choices.push("Invalid type.")
			choice = get_choice(choices, 1)
			if choice == 1 then
				return null
			else if choice == 2 then
				choices_b = ["\n<b>Which type of attack should this be listed as?"]
				choices_b.push("A root user password change")
				choices_b.push("A regular user password change")
				choices_b.push("A firewall")
				choices_b.push("Nevermind, leave it as it is.")
				choice_b = get_choice(choices_b, choices_b.len-1)
				if choice_b == 1 then
					changeExploitType(exploit, target, "rootpass")
					return null
				else if choice_b == 2 then
					changeExploitType(exploit, target, "userpass")
					return null
				else if choice_b == 3 then
					changeExploitType(exploit, target, "firewall")
					return null
				else
					continue
				end if
			end if
		else if typeof(overflowResult) == "shell" or typeof(overflowResult) == "computer" or typeof(overflowResult) == "file" or typeof(overflowResult) == "number" then
			if not exploit.type.lower == typeof(overflowResult) then
				changeExploitType(exploit, target, typeof(overflowResult).upper[0]+typeof(overflowResult)[1:])
			end if
			return overflowResult
		else
			return overflowResult
		end if
	end while
end function	

getAccessString = function(fileObj)
	perm = ""
	
	if fileObj.has_permission("r") then
		perm = "r"
	else
		perm = "-"
	end if
	
	if fileObj.has_permission("w") then
		perm = perm+"w"
	else
		perm = perm+"-"
	end if
	
	if fileObj.has_permission("x") then
		perm = perm+"x"
	else
		perm = perm+"-"
	end if
	
	return perm
end function

rshell_c = function()
	rs = globals.rshell
	if rs.active == true then
		if comp.public_ip == hc.public_ip and comp.local_ip == hc.local_ip then return null
		meta = loadMetaXPloit()
		meta.rshell_client(rs.ip,rs.port,"dsession")
	end if
end function

getShell = function(SHELL)
	Print(t.o+"Connected!")
	globals.ls = globals.shell
	globals.lc = globals.comp
	globals.lrouter = globals.rout
	globals.lip = idxp
	globals.lusr = globals.usr
	globals.llan = globals.lan
	globals.shell = SHELL
	globals.comp = SHELL.host_computer
	globals.lan = globals.comp.local_ip
	idxp = globals.comp.public_ip
	globals.rout = get_router(idxp)
	sus = getUser(globals.comp)
	globals.usr = sus
	globals.path = "/home/"+sus
	globals.ppath = "~"
	if sus == "?" then
		globals.path = "/"
		globals.ppath = "/"
	end if
	if sus == "root" then globals.path = "/root"
	rshell_c()
	if globals.config.deleteLogs == true then
		log = SHELL.host_computer.File("/var/system.log")
		if not log == null and log.has_permission("w") then
			log.delete
		end if
		log = globals.hs.host_computer.File("/var/system.log")
		if not log == null and log.has_permission("w") then
			log.delete
		end if
	end if
	return globals.shell
end function

system_message = function(text)
	return Print(t.bd+"[NamelessOS Notification] > "+C.e+text)
end function

NavToRoot = function(_file)
	if _file.name != "/" then
		return NavToRoot(_file.parent)
	end if
	return _file
end function

SearchFile = function(_file)
	if not _file.is_folder then
		if not _file.is_binary then
			if _file.name == "Bank.txt" or _file.name == "passwd" then
				Print(_file.name+"\n"+_file.get_content)
			end if
		end if
		return null
	end if
	files = _file.get_files
	folders = _file.get_folders
	for f in files
		SearchFile(f)
	end for
	for folder in folders
		SearchFile(folder)
	end for
	return null
end function

displayLocalMap = function(localMachineIP)
	router = globals.rout
	localPorts = router.device_ports(localMachineIP)
	externalPorts = router.used_ports
	
	r = loadMetaXPloit().net_use(router.public_ip)

	
	Print("\n<b>"+C.lb+"Local Machine at "+C.o+localMachineIP)
	if localPorts.len == 0 then Print("| | --> <i>"+C.o+"No local ports detected.</b>")
	for localPort in localPorts
		s = "| |"
		if localPort.is_closed then
			s = s+"-X-> "
		else
			s = s+"---> "
		end if
		s = padSpacesRight(s+":"+localPort.port_number+" ", 6)
		s = s+router.port_info(localPort)
		for externalPort in externalPorts
			iPort = router.ping_port(externalPort.port_number)
			if iPort.port_number == localPort.port_number and iPort.get_lan_ip == localMachineIP then
				s = s+"-->"+C.lb+" External Address: "+C.o+router.public_ip+""+C.db+":"+C.o+externalPort.port_number
			end if
		end for
		Print(s)
	end for
	
	Print("|\n|---> <b>"+router.essid_name+"</b> ("+router.bssid_name+")")
	Print("      "+C.db+"Public IP: <b>"+router.public_ip+"</b>  "+C.db+"Private IP: <b>"+router.local_ip+"</b>")
	routerLib = r.dump_lib
	whoisLines = whois(router.public_ip).split("\n")
	for whoisLine in whoisLines
		if whoisLine.len > 1 then
			cols = whoisLine.split(":")
			Print("      <b>"+padSpacesRight(cols[0], 25)+":</b> "+cols[1:].join(""))
		end if
	end for

	Print("      "+C.lb+routerLib.lib_name+" is at version: "+routerLib.version)
	if not router.kernel_version then
		Print(C.r+"Warning: "+C.db+"kernel_router.so not found")
	else
		Print("      "+C.lb+"kernel_router.so is at version: "+router.kernel_version)
	end if
end function

displayRouterMap = function(mRouter)
	r = loadMetaXPloit().net_use(mRouter.public_ip)

	if mRouter.essid_name == "" then
		essid_name = C.lb+"<i>No ESSID</i>"
	else
		essid_name = C.lb+mRouter.essid_name
	end if
	
	Print("\n<b>"+essid_name+"</b> ("+mRouter.bssid_name+")")
	Print(C.lb+"Public IP: <b>"+C.db+""+mRouter.public_ip+"</b>  "+C.lb+"Private IP: <b>"+C.db+""+mRouter.local_ip+"</b>")
	
	routerLib = r.dump_lib
	whoisLines = whois(mRouter.public_ip).split("\n")
	for whoisLine in whoisLines
		if whoisLine.len > 1 then
			cols = whoisLine.split(":")
			Print("<b>"+padSpacesRight(cols[0], 25)+":</b> "+cols[1:].join(""))
		end if
	end for
	Print(C.lb+routerLib.lib_name+""+C.db+" is at version: "+routerLib.version)
	if not mRouter.kernel_version then
		Print(C.r+"Warning: "+C.db+"kernel_router.so not found")
	else
		Print("      "+C.lb+"kernel_router.so is at version: "+mRouter.kernel_version)
	end if
	portFwds = []
	blankPorts = []
	for externalPort in mRouter.used_ports
		internal = mRouter.ping_port(externalPort.port_number)
		if internal then portFwds.push({"external":externalPort, "internal":internal})
		arrows = "--->"
		arrows2 = " ---> "
		if externalPort.is_closed then arrows = "-X->"
		if not mRouter.ping_port(externalPort.port_number) then
			arrows2 = " ---> ? "
		else if mRouter.ping_port(externalPort.port_number).is_closed then
			arrows2 = " -X-> "
		end if
		Print(" |  |"+arrows+" :"+C.o+padSpaces(externalPort.port_number, 5)+" "+C.lb+""+padSpaces(mRouter.port_info(externalPort).split(" ")[0], 8)+" "+C.db+""+padSpaces(mRouter.port_info(externalPort).split(" ")[1], 8)+arrows2+externalPort.get_lan_ip)
	end for
	
	if not mRouter.devices_lan_ip then
		Print(" |-> <i>"+C.o+"No local machines detected.</i>")
	else
		for localMachine in mRouter.devices_lan_ip
			Print(" |-> <b>"+C.lb+"Machine at "+C.o+localMachine+"</b>")
			vbar = "|"
			if mRouter.devices_lan_ip.indexOf(localMachine) == (mRouter.devices_lan_ip.len-1) then vbar = " "
			if not mRouter.device_ports(localMachine) then
				Print(" "+vbar+"   |--> <i>"+C.o+"No ports detected.</i>")
			else
				for port in mRouter.device_ports(localMachine)
					arrows = "-->"
					if port.is_closed then arrows = "-X>"
					toPrint = " "+vbar+"   |"+arrows+" :"+C.o+padSpaces(port.port_number, 5)+" "+C.lb+""+padSpaces(mRouter.port_info(port).split(" ")[0], 8)+" "+C.db+""+padSpaces(mRouter.port_info(port).split(" ")[1], 8)
					for portFwd in portFwds
						if port.get_lan_ip == portFwd.internal.get_lan_ip and port.port_number == portFwd.internal.port_number then toPrint = toPrint+" --->"+C.lb+" external port "+C.o+"<b>"+portFwd.external.port_number
					end for
					Print(toPrint)
				end for
			end if
		end for
	end if
end function

messWithProcs = function(computer)
	while 1
		choices = ["\n\n<b>The following processes have been detected on the machine:</b>\nChoose the one you would like to kill."]
		procs = computer.show_procs.split("\n")
		PIDs = []
		for b in range(0, procs.len-1)
			procCols = procs[b].split(" ")
			for c in range(0, procCols.len-2)
				procCols[c] = padSpaces(procCols[c], 10)
			end for
			if b == 0 then
				choices[0] = choices[0]+"\n     "+procCols.join("")
			else
				choices.push(procCols.join(""))
				PIDs.push(procCols[1])
			end if
		end for
		choices.push("<i>Leave these procs do their proc'ing (exit)</i>")
		choice = get_choice(choices, choices.len-1)
		if choice == choices.len-1 then return null
		Print("<b>Attempting to kill process ID: "+PIDs[choice-1])
		r = computer.close_program(PIDs[choice-1].to_int)
		if r == 1 then
			Print("<b>SUCCESS!</b>  You really showed that process you can murder it.")
		else if r == 0 then
			error("Could not find the process.")
		else
			error(r)
		end if
	end while
end function

messWithUsers = function(computer)
	choices = ["\n<b>What would you like to do?</b>"]
	choices.push("Add a user.")
	choices.push("Delete a user.")
	choices.push("Forget it.")
	choice = get_choice(choices, choices.len-1)
	result = null
	if choice == 1 then
		un = user_input("New user name? > ")
		pw = user_input("Password? > ")
		result = computer.create_user(un,pw)
	else if choice == 2 then
		un = user_input("User to delete? >")
		delHome = get_yesno(false,"Delete home directory?")
		result = computer.delete_user(un, delHome)
	else
		return null
	end if
	if result == 1 then
		return Print("<b>SUCCESS!</b>")
	else
		return error(result)
	end if
end function

crackPasswordFile = function(filePtr, hostInfo = "")
	crypto = loadLibrary("crypto.so", true)
	lines = filePtr.get_content.split("\n")
	hr = false
	for line in lines
		results = []
		line = split(line.trim, ":")
		if line.len == 2 and line[1].len == 32 then
			if line[0] == "root" then hr = true
		end if
	end for
	for line in lines
		results = []
		line = split(line.trim, ":")
		if line.len == 2 and line[1].len == 32 then
			if hr then
				if line[0] != "root" then continue
			end if
			Print("Cracking MD5 hash for user: <b><i>"+line[0]+"</b></i> in file: <b><i>"+filePtr.path+"</b></i>")
			pw = crypto.decipher(line[1])
			if pw then
				Print("Password: ["+pw+"]")
				globals.hc.touch(home_dir, "crackedPasswords.txt")
				f = globals.hc.File(home_dir+"/crackedPasswords.txt")
				f.set_content(f.get_content+"\n"+padSpaces(line[0]+"@"+pw, 30)+" "+hostInfo+": "+filePtr.name)
			end if
		end if
	end for
end function

crackAllFiles = function(filePtr, hostInfo = "")
	subDirs = filePtr.get_folders
	files = filePtr.get_files
	for file in files
		if file.has_permission("r") and not file.is_binary then crackPasswordFile(file, hostInfo)
	end for
	for dir in subDirs
		crackAllFiles(dir, hostInfo)
	end for
end function

crackAllFilesFromTop = function(filePtr, hostInfo = "")
	while filePtr.parent
		filePtr = filePtr.parent
	end while
	crackAllFiles(dir, hostInfo)
end function

findUnlockedRWString = function(readPerm, writePerm)
	if readPerm and writePerm then
		return "read and write"
	else if readPerm then
		return "read"
	else if writePerm then
		return "write"
	else
		return "no"
	end if
end function

findUnlocked = function(dirPtr)
	directories = dirPtr.get_folders
	files = dirPtr.get_files
	if dirPtr.has_permission("w") then Print("<color=#"+getColorString(dirPtr)+">Directory at <b>"+dirPtr.path+"</b> has write permission.")
	if files.len > 0 then
		for file in files
			if not findUnlockedRWString(file.has_permission("r"), file.has_permission("w")) == "no" then
				Print("<color=#"+getColorString(file)+">File at <b>"+file.path+"</b> has "+findUnlockedRWString(file.has_permission("r"), file.has_permission("w"))+" permissions.")
			end if
		end if
	end if
	if directories.len > 0 then
		for directory in directories
			findUnlocked(directory)
		end for
	end if
end function

findUnlockedDirs = function(f, output)
	for fo in f.get_folders
		if fo.has_permission("w") then
			output.push(fo)
		end if

		findUnlockedDirs(fo,output)
	end for
	
	return output
end function

browseFiles = function(dirPtr, hostInfo = "")
	while not dirPtr.parent == null
		dirPtr = dirPtr.parent
	end while
	rootPtr = dirPtr
	while 1
		directories = dirPtr.get_folders
		files = dirPtr.get_files
		choices = ["\n\n<b>Contents of "+dirPtr.path+":</b>\n     <color=#"+getColorString(dirPtr)+">"+dirPtr.permissions+padSpaces("", 19)+"<.>" ]
		isRoot = (dirPtr.path == "/")
		
		if not isRoot then choices.push("<color=#"+getColorString(dirPtr.parent)+">"+dirPtr.parent.permissions+"                   <..>"+C.e)
		
		for directory in directories			
			choices.push("<color=#"+getColorString(directory)+">"+directory.permissions+" "+padSpacesRight(directory.owner, 8, " ")+" "+padSpaces(directory.group, 8, " ")+" ./"+padSpaces(directory.name, 19, ".")+"<dir>"+C.e)
		end for
		
		if files.len > 25 then
			files = files[0:24]
			Print("Possible file bomb detected.  Only showing the first 25 files.")
		end if
		
		for file in files
			binString = "<binary>"
			if not file.is_binary then binString = "<text>"
			choices.push("<color=#"+getColorString(file)+">"+file.permissions+" "+padSpacesRight(file.owner, 8, " ")+" "+padSpaces(file.group, 8, " ")+" "+padSpaces(file.name, 20, ".")+"."+padSpaces(binString, 9)+parseSize(file.size)+C.e)
		end for
		
		choices.push("--- Stop browsing files ---")
		
		choice = get_choice(choices, choices.len-1)
		
		if choice == choices.len-1 then break
		
		if (not isRoot and choice == 1) then
			dirPtr = dirPtr.parent
		else if (directories.len > 0 and isRoot and choice <= directories.len) or (directories.len > 0 and not isRoot and choice <= (1+directories.len)) then
			if isRoot then
				dirPtr = directories[choice-1]
			else
				dirPtr = directories[choice-2]
			end if
		else if (file.len > 0 and isRoot and choice > directories.len) or (file.len > 0 and not isRoot and choice > (directories.len+1)) then
			filePtr = null
			if isRoot then
				filePtr = files[choice - directories.len - 1]
			else
				filePtr = files[choice - directories.len - 2]
			end if
			choicesb = ["\n\n<b>What would you like to do with this file?"]
			choicesb.push("Display contents")
			choicesb.push("Download file")
			choicesb.push("Over-write file")
			choicesb.push("Delete")
			choicesb.push("Append")
			choicesb.push("Scan for and crack passwords")
			//choicesb.push("Unlock all files from here down")
			choicesb.push("Do nothing")
			choiceb = get_choice(choicesb, choicesb.len-1)
			if choiceb == choicesb.len-1 then break
			if choiceb == 1 then
				if filePtr.get_content then
					if choiceb == 1 then
						Print("\n\n<b>Contents of file: "+filePtr.name+"</b>")
						Print(filePtr.get_content)
					end if
				else
					error("Could not read the contents of this file - Check permissions and file type.")
				end if
			else if choiceb == 2 then
				Print("Saving file to: /root/Downloads/"+filePtr.name)
				x = globals.shell.scp(filePtr.path, "/root/Downloads", globals.hs)
				if(x == 1) then
					Print("File downloaded successfully.")
				else
					error(x)
				end if
			else if choiceb == 3 then
				x = user_input("<b>Please enter what you would like to replace the contents of this file with.</b>\n")
				x = filePtr.set_content(x)
				if(x == 1) then
					Print("File overwritten successfully.")
				else
					error(x)
				end if
			else if choiceb == 4 then
				if get_yesno(false, "Are you sure you want to delete this file?") then
					x = filePtr.delete
					if x == "" then
						Print(" .. File deleted successfully.")
					else
						error(x)
					end if
				end if
			else if choiceb == 6 then
				if not filePtr.get_content then
					error("Could not read the contents of this file - Check permissions and file type.")
					continue
				else
					Print("Scanning contents...")
					crackPasswordFile(filePtr)
					Print("Cracked passwords have been saved in <b><i>" + home_dir + "/crackedPasswords.txt</b></i>")
				end if
			else if choiceb == 5 then
				x = user_input("<b>Please enter what you would like to add to the contents of this file.</b>\n")
				x = filePtr.set_content(filePtr.get_content + "\n" + x)
				if(x == 1) then
					Print("File appended successfully.")
				else
					error(x)
				end if			
			end if
		end if
	end while
end function

Commands = {}

Commands["help"] = {"Name": "help","Description": "List all commands.","Args": ""}
Commands["help"]["Run"] = function(args,pipe)
	Ret = "\n"+C.g+"Commands:"+C.e+"\n"

	for Command in Commands
		CData = Command.value
		Ret = Ret+"		"+C.lc+ CData.Name +C.y+" "+ CData.Args.trim +C.lc+" -> "+C.o+ CData.Description+"\n"
	end for

	return Print(Ret)
end function

Commands["man"] = {"Name": "man","Description": "Shows description and args for command.","Args": "[command]"}
Commands["man"]["Run"] = function(params,pipe)
	cmdn = params[0]
	CData = null
	foun = false
	for Command in Commands
		if cmdn == Command.value.Name then
			foun = true
			CData= Command.value
		end if
	end for

	if foun==true then
		msg = C.lc+ CData.Name +C.y+" "+ CData.Args.trim +C.lc+" -> "+C.o+ CData.Description
		return Print(msg)
	else
		return error("Command not found!")
	end if
end function

Commands["ls"] = {"Name": "ls","Description": "List all files.","Args": "[(opt) path]"}
Commands["ls"]["Run"] = function(args,pipe)
	computer = globals.shell.host_computer
	folderPath = globals.path
	if args.len == 1 then
		folderPath = args[0]
	end if
	
	folder = computer.File(folderPath)
	if folder == null then
		return error("No such file or directory")
	else
		showHide = 1
		showDetails = 1

		subFiles = folder.get_folders+folder.get_files
		subFiles.sort
		output = C.o+"<b>NAME TYPE +WRX FILE_SIZE PERMISSIONS OWNER GROUP</b>"+C.e
		for subFile in subFiles
			nameFile = subFile.name.replace(" ","_")
			permission = subFile.permissions
			owner = subFile.owner
			size = subFile.size
			group = subFile.group
			type = "txt"
			if subFile.is_binary == 1 then type = "bin"
			if subFile.is_folder == 1 then type = "fld"

			WRX = ""
			if subFile.has_permission("w") then WRX = WRX+"w" else WRX = WRX+"-"
			if subFile.has_permission("r") then WRX = WRX+"r" else WRX = WRX+"-"
			if subFile.has_permission("x") then WRX = WRX+"x" else WRX = WRX+"-"

			output = output+"\n<color=#"+getColorString(subFile)+">"+nameFile+" ["+type+"] ["+WRX+"] ["+parseSize(size)+"] ["+permission+"] ["+owner+"] ["+group+"]" 
		end for
		
		return Print(format_columns(output))
	end if
end function

Commands["search"] = {"Name": "search","Description": "Searches for files or directorys you have access to.","Args": "[(opt) name]"}
Commands["search"]["Run"] = function(args,pipe)
	if args.len == 0 and pipe then args.push(pipe)
	if args.len == 0 then args.push("*")
	file = args[0]

	files = rm_dupe(FindFile(file))
	for dirx in rm_dupe(FindFolder(file))
		files.push(dirx)
	end for

	if files.len == 0 then
		error("No files found.")
		return null
	else
		showHide = 1
		showDetails = 1
		files = rm_dupe(files)
		files.sort
		output = C.o+"<b>NAME TYPE +WRX FILE_SIZE PERMISSIONS OWNER GROUP PATH</b>"+C.e
		for subFile in files
			subFile = globals.comp.File(subFile)
			nameFile = subFile.name.replace(" ","_")
			permission = subFile.permissions
			owner = subFile.owner
			size = subFile.size
			group = subFile.group
			dir = subFile.path.replace(" ","_")
			type = "txt"
			if subFile.is_binary == 1 then type = "bin"
			if subFile.is_folder == 1 then type = "fld"

			WRX = ""
			if subFile.has_permission("w") then WRX = WRX+"w" else WRX = WRX+"-"
			if subFile.has_permission("r") then WRX = WRX+"r" else WRX = WRX+"-"
			if subFile.has_permission("x") then WRX = WRX+"x" else WRX = WRX+"-"

			if WRX != "---" then
				output = output+"\n<color=#"+getColorString(subFile)+">"+nameFile+" ["+type+"] ["+WRX+"] ["+parseSize(size)+"] ["+permission+"] ["+owner+"] ["+group+"] ["+dir+"]"+C.e 
			end if
		end for
		
		return Print(format_columns(output))
	end if
end function

Commands["find"] = {"Name": "find","Description": "Finds a file or directory.","Args": "[(opt) name]"}
Commands["find"]["Run"] = function(args,pipe)
	if args.len == 0 and pipe then args.push(pipe)
	if args.len == 0 then args.push("*")
	file = args[0]

	files = rm_dupe(FindFile(file))
	for dirx in rm_dupe(FindFolder(file))
		files.push(dirx)
	end for

	if files.len == 0 then
		error("No files found.")
		return null
	else
		showHide = 1
		showDetails = 1
		files = rm_dupe(files)
		files.sort
		output = C.o+"<b>NAME TYPE +WRX FILE_SIZE PERMISSIONS OWNER GROUP PATH</b>"+C.e
		for subFile in files
			subFile = globals.comp.File(subFile)
			nameFile = subFile.name.replace(" ","_")
			permission = subFile.permissions
			owner = subFile.owner
			size = subFile.size
			group = subFile.group
			dir = subFile.path.replace(" ","_")
			type = "txt"
			if subFile.is_binary == 1 then type = "bin"
			if subFile.is_folder == 1 then type = "fld"

			WRX = ""
			if subFile.has_permission("w") then WRX = WRX+"w" else WRX = WRX+"-"
			if subFile.has_permission("r") then WRX = WRX+"r" else WRX = WRX+"-"
			if subFile.has_permission("x") then WRX = WRX+"x" else WRX = WRX+"-"

			output = output+"\n<color=#"+getColorString(subFile)+">"+nameFile+" ["+type+"] ["+WRX+"] ["+parseSize(size)+"] ["+permission+"] ["+owner+"] ["+group+"] ["+dir+"]"+C.e 
		end for
		
		return Print(format_columns(output))
	end if
end function

Commands["ps"] = {"Name": "ps","Description": "Shows the active processes of the operating system.","Args": ""}
Commands["ps"]["Run"] = function(args,pipe)
	procs = globals.shell.host_computer.show_procs
	procs = procs.split("\n")
	output = ""

	for proc in procs
		val = proc.split(" ")
		if val[0] == "USER" then continue

		output = output+"\n"+C.w+"["+C.o+val[0]+C.w+"] ("+C.o+val[1]+C.w+") "+C.o+val[4]+" "+C.w+"CPU: ["+C.o+val[2]+C.w+"] "+C.w+"MEM: ["+C.o+val[3]+C.w+"]"
	end for

	Print(format_columns(output))
	return output
end function

Commands["pwd"] = {"Name": "pwd","Description": "Prints current directory.","Args": ""}
Commands["pwd"]["Run"] = function(args,pipe)
	Print(C.o+globals.path)
	return globals.path
end function

Commands["haslib"] = {"Name": "hasLib","Description": "Lib check.","Args": "[lib]"}
Commands["haslib"]["Run"] = function(args,pipe)
	crypto = include_lib(args[0])
	return Print(crypto)
end function

Commands["rat"] = {"Name": "rat","Description": "Rats the connected pc.","Args": ""}
Commands["rat"]["Run"] = function(args,pipe)
	return rshell_c()
end function

Commands["ratted"] = {"Name": "ratted","Description": "Views the ratted pcs.","Args": "[(opt) login]"}
Commands["ratted"]["Run"] = function(args,pipe)
	login = globals.config.db_pass
	rs = globals.rshell
	if args.len == 1 then login = args[0]

	sh = globals.shell.connect_service(rs.ip, rs.login, "root", login, "ssh")
	if not sh then return error("Invalid password!")
	securesys(sh)
	sh.start_terminal
	return sh.launch("/root/rshell_interface")
end function

Commands["db"] = {"Name": "db","Description": "Logs into the db.","Args": ""}
Commands["db"]["Run"] = function(args,pipe)
	sh = globals.shell.connect_service(globals.config.db, 22, "root", globals.config.db_pass, "ssh")
	if not sh then return error("Invalid password!")
	securesys(sh)
	return getShell(sh)
end function

Commands["cd"] = {"Name": "cd","Description": "Moves to a different directory.","Args": "[path]"}
Commands["cd"]["Run"] = function(args,pipe)
	computer = globals.comp
	if computer.File(args[0]) then
		globals.path = computer.File(args[0]).path
	else
		if computer.File(globals.path+"/"+args[0]) then
			globals.path = computer.File(globals.path+"/"+args[0]).path
		else
			error("No such file or directory")
		end if
	end if
	globals.ppath = pparse(globals.path)
	return globals.path
end function

Commands["shell"] = {"Name": "shell","Description": "Starts a normal shell.","Args": ""}
Commands["shell"]["Run"] = function(args,pipe)
	return globals.shell.start_terminal()
end function

Commands["vpn"] = {"Name": "vpn","Description": "Randomizes your ip and makes the trace longer.","Args": ""}
Commands["vpn"]["Run"] = function(params,pipe)
	globals.proxys.shuffle

	sh = null

	connect = function(ip,pass,pipe)
		info("Routing...")
		remote = globals.shell.connect_service(ip, 22, "root", pass, "ssh")
		if remote then
			securesys(remote)
			getShell(remote)
			
			info("Routed!")
		end if
		
		return sh
	end function

	for data in globals.proxys
		connect(data["ip"],data["password"])
	end for

	if sh then
		securesys(sh)
		return getShell(sh)
	end if
end function

Commands["clear"] = {"Name": "clear","Description": "Delete any text from the terminal.","Args": ""}
Commands["clear"]["Run"] = function(args,pipe)
	return clear_screen
end function

Commands["exit"] = {"Name": "exit","Description": "Exits from NamelessOS.","Args": ""}
Commands["exit"]["Run"] = function(args,pipe)
	return exit("Exiting NamelessOS...")
end function

Commands["escalate"] = {"Name": "escalate","Description": "Escalates your shell permissions.","Args": ""}
Commands["escalate"]["Run"] = function(Args,pipe)
	startev = function()
		cryptools = loadLibrary("crypto.so")
		if not cryptools then return error("Can't find crypto library")

		metaxploit = loadLibrary("metaxploit.so")
		if not metaxploit then return error("Can't find metaxploit library")

		if (globals.hc.public_ip == globals.comp.public_ip and globals.hc.local_ip == globals.comp.local_ip) or globals.ar == "escalate" then
			GetPassword = function(userPass)
				if userPass.len != 2 then return error("wrong syntax")
				password = cryptools.decipher(userPass[1])
				if password then
					return password
				else
					return null
				end if
			end function

			passwds = FindFile("passwd",globals.shell,"pwd")
			for passwd in passwds
				if passwd != null then
					cont = passwd.split("\n")
					for c in cont
						cc = c.split(":")
						if cc.len == 2 then
							if cc[0] == "root" then
								p = GetPassword(cc)
								if p != null then
									shell = get_shell("root", p)
									if shell then
										info("Fake password")
									else
										return getShell(shell)
									end if
								else
									info("Fake password.")
								end if
							end if
						end if
					end for
				else
					info("Cant find /etc/passwd")
				end if
			end for

			libs = FindFile("*.so")
			metas = []
			for lib in libs
				m = metaxploit.load(lib)
				if m != null then
					metas.push( m )
				end if
			end for

			for metaLib in metas

				exploits = loadExploits(metaLib)
					
				if exploits.len == 0 then
					scanTarget(metaLib)
					exploits = loadExploits(metaLib)
				end if

				for exploit in exploits
					vuls = []
					output = ""
					vuls.push(exploit.memory+":"+exploit.string)

					for v in vuls
						data = v.split(":")
						res = null

						ps = []
						if exploit.hasIndex("parameters") then
							for parameter in exploit.parameters
								if parameter == "Local IP Address" then
									ps.push(globals.comp.local_ip)
								else if parameter == "New Password" then
									ps.push(globals.config.passwdChange)
								else
									Print("<b>Additional information needed.  Please answer the following questions</b>")
									ps.push(user_input(parameter+" >"))
								end if
							end for
						end if
						
						if ps.len == 0 then
							res = metaLib.overflow(exploit.memory, exploit.string)
						else if ps.len == 1 then
							res = metaLib.overflow(exploit.memory, exploit.string, ps[0])
						else if ps.len == 2 then
							res = metaLib.overflow(exploit.memory, exploit.string, ps[0], ps[1])
						else if ps.len == 3 then
							res = metaLib.overflow(exploit.memory, exploit.string, ps[0], ps[1], ps[2])
						else
							error("Too many parameters")
							return null
						end if
						if res != null then
							type = typeof(res)
							if type == "shell" then
								sus = getUser(res.host_computer)
								if sus == "root" then return getShell(res)
								if globals.usr == "guest" then
									if sus != "guest" then
										return getShell(res)
									end if
								end if
							end if

							if type == "number" then
								info("Password changed to '"+globals.config.passwdChange+"'")
							end if

							if type == "file" then
								Root = NavToRoot(res)

								passwds = FindFile("passwd",res,"pwd")
								for passwd in passwds
									if passwd and passwd != null then
										Print(passwd)
										cont = passwd.split("\n")
										for c in cont
											cc = c.split(":")
											if cc.len == 2 then
												if cc[0] == "root" then
													p = GetPassword(cc)
													if p != null then
														shell = get_shell("root", p)
														if shell then
															info("Fake password")
														else
															return getShell(shell)
														end if
													else
														info("Fake password.")
													end if
												end if
											end if
										end for
									else
										info("Cant find /etc/passwd")
									end if
								end for

							end if

							if type == "computer" then

								if globals.config.deleteLogs == true then
									var = res.File("/var/system.log")
									if var then
										if var.has_permission("w") then
											var.delete()
											info("Logs deleted")
										else
											info("Cant delete logs")
										end if
									else
										info("Cant find /var/system.log")
									end if
								end if

								passwds = FindFile("passwd",res,"pwd")
								for passwd in passwds
									if passwd and passwd != null then
										Print(passwd)
										cont = passwd.split("\n")
										for c in cont
											cc = c.split(":")
											if cc.len == 2 then
												if cc[0] == "root" then
													p = GetPassword(cc)
													if p != null then
														shell = get_shell("root", p)
														if shell then
															info("Fake password")
														else
															return getShell(shell)
														end if
													else
														info("Fake password.")
													end if
												end if
											end if
										end for
									else
										info("Cant find /etc/passwd")
									end if
								end for			
							end if
						end if
					end for
				end for
			end for
		else
			dirs = findUnlockedDirs(globals.comp.File("/"),[])
			if dirs.len > 0 then
				ddir = null
				for dir in dirs
					if dir.has_permission("w") then ddir = dir
					if dir.has_permission("w") and dir.has_permission("x") then ddir = dir
					if dir.has_permission("w") and dir.has_permission("r") then ddir = dir
					if dir.has_permission("w") and dir.has_permission("r") and dir.has_permission("x") then ddir = dir
					if dir.parent.name == "." then ddir = dir.parent
				end for

				mkd = globals.comp.create_folder(ddir.path, ".")
				if mkd == 1 then
					dir = globals.comp.File(ddir.path+"/.")
					x = globals.hs.scp(program_path, dir.path, globals.shell)
					if(x == 1) then
						if not findLibrary("crypto.so",2) then
							globals.hs.scp(findLibrary("crypto.so"), dir.path, globals.shell)
						end if

						if not findLibrary("metaxploit.so",2) then
							globals.hs.scp(findLibrary("metaxploit.so"), dir.path, globals.shell)
						end if

						prgd = dir.path+"/"+globals.hc.File(program_path).name
						if not globals.comp.File(prgd) then
							globals.hs.scp(program_path, dir.path, globals.shell)
						end if

						args = [globals.login,"escalate"]
						globals.shell.launch(prgd,args.join(" "))
					end if
				else
					Print("Invalid Permissions.")
				end if
			else
				Print("Unable to find vulnerable folder cant escalate.")
			end if
		end if
	end function

	if globals.usr == "root" then
		return Print("You already have root.")
	else
		return startev()
	end if
end function

Commands["back"] = {"Name": "back","Description": "Goes back to the last shell.","Args": ""}
Commands["back"]["Run"] = function(args,pipe)
	globals.shell = globals.ls
	globals.comp = globals.lc
	sus = getUser(globals.comp)
	globals.usr = sus
	globals.rout = globals.lrouter
	idxp = globals.lip
	globals.lan = globals.llan
	globals.path = "/home/"+sus
	globals.ppath = "~"
	if sus == "?" then
		globals.path = "/"
		globals.ppath = "/"
	end if
	if sus == "root" then globals.path = "/root"
end function

Commands["up"] = {"Name": "up","Description": "Uploads a file.","Args": "[path]"}
Commands["up"]["Run"] = function(args,pipe)
	pathFile = args[0]

	file = globals.hs.host_computer.File(pathFile)
	if file == null then return error("file not found: "+pathFile)

	Print("Uploading file to: "+pparse(globals.ppath)+"/"+file.name)
	x = globals.hs.scp(file.path, globals.path, globals.shell)
	if(x == 1) then
		return Print("File downloaded successfully.")
	else
		return error(x)
	end if
end function

Commands["dl"] = {"Name": "dl","Description": "Downloads a file.","Args": "[path]"}
Commands["dl"]["Run"] = function(args,pipe)
	pathFile = args[0]

	file = globals.shell.host_computer.File(pathFile)
	if file == null then file = globals.shell.host_computer.File(path+"/"+pathFile)
	if file == null then return error("file not found: "+pathFile)

	Print("Saving file to: /root/Downloads/"+file.name)
	x = globals.shell.scp(file.path, "/root/Downloads", globals.hs)
	if(x == 1) then
		return Print("File downloaded successfully.")
	else
		return error(x)
	end if
end function

Commands["cat"] = {"Name": "cat","Description": "Shows the contents of a text file.","Args": "[file]"}
Commands["cat"]["Run"] = function(params,pipe)
	pathFile = params[0]
	if pipe then pathFile = pipe
	file = globals.shell.host_computer.File(pathFile)
	if file == null then file = globals.shell.host_computer.File(path+"/"+pathFile)
	if file == null then return error("file not found: "+pathFile)
	if file.is_binary then return error("can't open "+file.path+". Binary file")	
	if not file.has_permission("r") then return error("permission denied")

	return Print(file.get_content)
end function

Commands["rm"] = {"Name": "rm","Description": "Delete any file if you have the appropriate permissions.","Args": "[(opt) -r] [file]"}
Commands["rm"]["Run"] = function(args,pipe)
	pathFile = args[0]
	if pipe then pathFile = pipe
	isRecursive = 0
	if args[0] == "-r" then
		isRecursive = 1
		pathFile = args[1]
	end if
	file = globals.shell.host_computer.File(pathFile)
		
	if file == null then return error("file not found: "+pathFile)
	if not file.has_permission("w") then return error("permission denied")
	if file.is_folder == 1 and isRecursive == 0 then
		return error(file.name+" is a directory")
	else
		return file.delete
	end if
end function

Commands["iwlist"] = {"Name": "iwlist","Description": "Shows the list of wifi networks visible from your computer.","Args": ""}
Commands["iwlist"]["Run"] = function(params,pipe)
	c = globals.comp

	if c.wifi_networks("wlan0")[0] != null then interface="wlan0"
	if c.wifi_networks("eth0")[0] != null then interface="eth0"

	la = 999999
	laa = 999999
	networks = c.wifi_networks(interface)
	bssid = ""
	essid = ""
	tack = ""
	xx = false
	for net in networks
		ack = ceil(300000/net.split(" ")[1].remove("%").val)
		if ack < laa then
			if xx == false then
				essid = net.split(" ")[2]
				laa = ack
			end if
		end if
	end for

	for net in networks
		ack = ceil(300000/net.split(" ")[1].remove("%").val)
		if ack < la then
			if xx == false then
				bssid = net.split(" ")[0]
				la = ack
			end if
		end if
		if essid == net.split(" ")[2] then
			Print(C.o+net+" "+C.y+"["+ack+"] "+C.rr+"(Highest)")
			tack = ack
		else
			Print(C.o+net+" "+C.y+"["+ack+"]")
		end if
		if ack != tack then
			ack = tack
		end if
	end for
end function

Commands["wifi"] = {"Name": "wifi","Description": "Hacks the specified wifi or the one with the highest connection.","Args": "[(opt) essid]"}
Commands["wifi"]["Run"] = function(params,pipe)

	w = ""
	if params.len >= 1 then
		w = params[0]
	end if
	if pipe then w = pipe

	crypto = loadLibrary("crypto.so",true)
	if not crypto then return error("Can't find crypto library")

	c = globals.comp

	if c.wifi_networks("wlan0")[0] != null then interface="wlan0"
	if c.wifi_networks("eth0")[0] != null then interface="eth0"

	la = 999999
	laa = 999999
	networks = c.wifi_networks(interface)
	bssid = ""
	essid = ""
	tack = ""
	xx = false
	for net in networks
		ack = ceil(300000/net.split(" ")[1].remove("%").val)
		if w == net.split(" ")[2] then
			essid = net.split(" ")[2]
		else if ack < laa then
			if xx == false then
				essid = net.split(" ")[2]
				laa = ack
			end if
		end if
	end for

	for net in networks
		ack = ceil(300000/net.split(" ")[1].remove("%").val)
		if w == net.split(" ")[2] then
			bssid = net.split(" ")[0]
			la = ack
			xx = true
		else if ack < la then
			if xx == false then
				bssid = net.split(" ")[0]
				la = ack
			end if
		end if
		if essid == net.split(" ")[2] then
			Print(C.o+net+" "+C.y+"["+ack+"] "+C.rr+"(SELECTED)")
			tack = ack
		else
			Print(C.o+net+" "+C.y+"["+ack+"]")
		end if
		if ack != tack then
			ack = tack
		end if
	end for
	f = c.File(current_path+"/file.cap")
	if f then f.delete
	crypto.airmon("start", interface)
	r1 = crypto.aireplay(bssid,essid,ack)
	if typeof(r1) == "string" then return error(r1)
	pass = crypto.aircrack(current_path+"/file.cap")
	if pass == "" then return error("Terminated!")
	c.connect_wifi(interface,bssid,essid,pass)
	f = c.File(current_path+"/file.cap")
	if f then f.delete
	crypto.airmon("stop", interface)
	return Print(C.o+"Connected, Creds: "+C.r+essid+":"+pass)
end function

Commands["sudo"] = {"Name": "sudo","Description": "It allows users to run programs with administrator security privileges.","Args": "[(opt) -s] [command]"}
Commands["sudo"]["Run"] = function(Args,pipe)
	inputPass = user_input("Password: ", true)
	if Args[0] == "-u" then
		shell = get_shell(Args[2], inputPass)
		if not shell then return error("incorrect username or password")
		getShell(shell)
	else if Args[0] == "-s" then
		shell = get_shell("root", inputPass)
		if not shell then return error("incorrect password")
		getShell(shell)
	end if

	if Args[0] == "-s" or Args[1] == "-u" then
	else
		computer = shell.host_computer
		args = Args[1:].join(" ")
		if not Args[0].indexOf("/") then
			globalPath = [globals.path, "/bin", "/usr/bin"]
			for path in globalPath
				program = computer.File(path+"/"+Args[1])
				if program != null then return error(shell.launch(program.path, args))
			end for
		else
			program = computer.File(Args[1])
			if not program then return error(Args[1]+" not found.")
			shell.launch(program.path, args)
		end if
	end if
end function

Commands["grep"] = {"Name": "grep","Description": "Looks for text in a string.","Args": "[search] [string]"}
Commands["grep"]["Run"] = function(Args,pipe)
	if pipe then Args.push(pipe)
	search = Args[0]
	input = Args[1]

	if input.split("\n").len != 0 then
		lines = input.split("\n")
		f = []
		for line in lines
			if line.split(search).len >= 2 then f.push(line)
		end for

		if f.len == 1 then f = f[0]
		Print(f)
		return f
	else
		Print(input)
		return input
	end if
end function

Commands["crack"] = {"Name": "crack","Description": "Cracks a hash.","Args": "[hash]"}
Commands["crack"]["Run"] = function(Args,pipe)
	crypto = loadLibrary("crypto.so",true)
	if not crypto then return error("Can't find crypto library")
	out = ""
	login = Args[0]
	if pipe then login = pipe
	hashes=login
	if typeof(login)!="list" then	
		hashes=[login]
	end if

	for hash in hashes
		if login.split(":").len == 2 then login = login.split(":")[1]
		got = crypto.decipher(login)
		if got != null then
			out=out+t.t+login+" -> "+got+"\n"
		else
			out=out+t.t+login+" -> "+t.e+"Invalid Hash\n"
		end if
	end for
	return Print(out)
end function

Commands["rshells"] = {"Name": "rshells","Description": "Terminal interface to interact with the installed rshell server and manage incoming connections.","Args": ""}
Commands["rshells"]["Run"] = function(args,pipe)
	metaxploit = loadMetaXPloit()
	if not metaxploit then exit("Error: Can't find metaxploit library")
	Print("Listening for upcoming connections...")

	shells = []
	while shells.len == 0	
		shells = metaxploit.rshell_server
		if(typeof(shells) == "string") then exit(shells)	
		if(shells.len == 0) then wait(2)
	end while

	option = 0
	while typeof(option) !=  "number" or (option < 1 or option > shells.len)
		Print(shells.len + " shell(s) connected!\n<b>Select a shell to start a terminal:</b>")
		for i in range(0, shells.len - 1)
			shel = shells[i]
			wlsys(shel)
			Print("\n<b>Shell (" + (i + 1) + ")</b>\nUser: "+ uparse(getUser(shel.host_computer)) +"\nPublic IP: " + shel.host_computer.public_ip + "\nLocal IP: " + shel.host_computer.local_ip)
		end for
		Print("-----------")
		option = user_input("Select shell>").to_int
	end while
	Print("Starting shell #" + option)
	return getShell(shells[option - 1])
end function

Commands["sniff"] = {"Name": "sniff","Description": "The terminal listens to the network packets of any connection that passes through this device.","Args": "[(opt) saveEncSource]"}
Commands["sniff"]["Run"] = function(params,pipe)

	metaxploit = loadMetaXPloit()
	if not metaxploit then return error("Error: Can't find metaxploit library")

	Print("Starting listen...\nWaiting to incoming data.")

	while 1
		output = metaxploit.sniffer(params.len == 1)
		if not output then
			error("Unknown error: can't start to listening")
		else
			Print(output)
		end if
	end while
end function

Commands["kernel.panic"] = {"Name": "kernel.panic","Description": "Destroy everything (requires reboot).","Args": ""}
Commands["kernel.panic"]["Run"] = function(params,pipe)
	reboot = null

	if globals.comp.File("/boot") and globals.comp.File("/boot").has_permission("w") then
		globals.comp.File("/boot").delete
	end if
	
end function

Commands["forkbomb"] = {"Name": "forkbomb","Description": "Fills up the ram.","Args": ""}
Commands["forkbomb"]["Run"] = function(params,pipe)

	rs = globals.rshell

	meta = loadMetaXPloit()
	i=0
	act = true
	while act == true
		meta.rshell_client(rs.ip,rs.port,"Xorg")
		i=i+1
		if i == 50 then act = false
		wait()
	end while

	Print(C.G+"Success!")
end function

Commands["files"] = {"Name": "files","Description": "File browser.","Args": ""}
Commands["files"]["Run"] = function(params,pipe)

	
	while 1
		choices = ["\n\n<b>Options:</b>"]
		choices.push(C.y+"Browse through the files.")
		choices.push(C.y+"Create a file on the computer.")
		choices.push(C.y+"Mess with users")
		choices.push(C.y+"Mess with processes")
		choices.push(C.y+"Scan entire machine for passwords (and crack them)")
		choices.push(C.y+"Scan entire machine for vulnerable directories and files")
		choices.push(C.rr+"Go Back.")
		choice = get_choice(choices, choices.len-1)
		if choice == choices.len-1 then break
		if choice == 1 then
			browseFiles(globals.comp.File("/"), globals.comp.public_ip+"->"+globals.comp.local_ip)
		else if choice == 2 then
			path = user_input("Path to new file (Do not include file name) >")
			filename = user_input("File name for new file > ")
			x = globals.comp.touch(path, filename)
			if x == 1 then
				Print("File successfully created at "+path+"/"+filename)
			else
				error(x)
			end if
		else if choice == 3 then
			messWithUsers(globals.comp)
		else if choice == 4 then
			messWithProcs(globals.comp)
		else if choice == 5 then
			crackAllFiles(globals.comp.File("/"), vul.metaLib.public_ip+" --> "+vul.metaLib.local_ip)
			Print("Cracked passwords have been saved in <b><i>"+home_dir+"/crackedPasswords.txt</b></i>")
		else if choice == 6 then
			findUnlocked(globals.comp.File("/"))
		end if
	end while
end function

Commands["nmap"] = {"Name": "nmap","Description": "Scans an ip/domain for ports and local ips.","Args": "[ip/domain]"}
Commands["nmap"]["Run"] = function(args,pipe)
	ip = args[0]
	if pipe then ip = pipe
	port = null
	ipAddr = null
	
	if not is_valid_ip(ip) then
		if is_valid_ip(nslookup(ip)) then
			ip = nslookup(ip)
		else
			return error("IP not found!")
		end if
	end if
	ipAddr = ip
	
	metaxploit = loadMetaXPloit()

	if is_lan_ip(ipAddr) then
		routerLib = metaxploit.net_use(globals.rout.public_ip)

		displayLocalMap(ipAddr)
	else
		router = getRouter(ipAddr)
		routerLib = metaxploit.net_use(router.public_ip)

		displayRouterMap(router)
	end if
end function

Commands["router"] = {"Name": "router","Description": "Scans the router for firewall rules.","Args": "[ip]"}
Commands["router"]["Run"] = function(params,pipe)
	ipAddress = params[0]
	if pipe then ipAddress = pipe

	router = get_router( ipAddress )
	if router == null then return error("scanrouter: ip address not found")
	Print("Connecting to router at address: " + ipAddress + "\nScanning kernel library...")
	version = router.kernel_version
	if not version then
		Print("Warning: kernel_router.so not found")
	else
		Print("kernel_router.so : v" + version)
	end if

	firewall_rules = router.firewall_rules
	if typeof(firewall_rules) == "string" then return error(firewall_rules)
	Print("\nScanning firewall rules...\n")
	if firewall_rules.len == 0 then return error("No rules found.")
	info = C.o+"<b>ACTION PORT SOURCE_IP DESTINATION_IP"
	for rules in firewall_rules
		info = info + "\n" + rules
	end for
	Print(format_columns(info) + "\n")
	return info
end function

Commands["ssh"] = {"Name": "ssh","Description": "Access to private servers through a back door.","Args": "[user@password] [ip] [(opt) port]"}
Commands["ssh"]["Run"] = function(args,pipe)
	ip = args[1]
	if pipe then args[0] = pipe
	credentials = args[0].split("@")
	user = credentials[0]
	password = credentials[1]
	port = 22
	serv = "ssh"
	if args.len == 3 then
		port = args[2].to_int
		if port == "21" then serv = "ftp"
	end if

	if typeof(port) != "number" then return error("Invalid port: "+port)
	remote = globals.shell.connect_service(ip, port, user, password, serv)
	if remote then
		wlsys(remote)
		return getShell(remote)
	end if
	
end function

Commands["echo"] = {"Name": "echo","Description": "Prints text.","Args": "[text]"}
Commands["echo"]["Run"] = function(args,pipe)
	if pipe then args[0] = pipe
	text = args[0]
	Print(text)
	return text
end function

Commands["secure"] = {"Name": "secure","Description": "Secures the connected system.", "Args": ""}
Commands["secure"]["Run"] = function(args,pipe)
	securesys(globals.shell)
end function

Commands["scan"] = {"Name": "scan","Description": "Scans an ip/domain for vulns.","Args": "[ip/domain] [(opt) port]"}
Commands["scan"]["Run"] = function(args,pipe)
	ip = args[0]
	port = null
	ipAddr = null
	
	globals.H = []

	if not is_valid_ip(ip) then
		if is_valid_ip(nslookup(ip)) then
			ip = nslookup(ip)
		else
			return error("IP not found!")
		end if
	end if
	ipAddr = ip

	if args.len == 2 then port = args[1]
	
	metaxploit = loadMetaXPloit()

	if is_lan_ip(ipAddr) then
		routerLib = metaxploit.net_use(globals.rout.public_ip)
		metaLibs = extractMetaLibs(ipAddr)
	else
		router = getRouter(ipAddr)
		routerLib = metaxploit.net_use(router.public_ip)
		metaLibs = extractMetaLibs(router)
	end if

	for metaLib in metaLibs
		if port!=null then
			if metaLib.port_number != port then continue
		end if

		if loadExploits(metaLib.metaLib).len == 0 then
			scanTarget(metaLib.metaLib)
		end if
		exploits = loadExploits(metaLib.metaLib)
		
		exps = []
		for exploit in exploits
			exploitObj = runExploit(exploit, metaLib.metaLib, metaLib.local_ip)
			exps.push(exploitObj)
		end for

		globals.H.push({"exploits":exps,"metaLib":metaLib})
	end for

	return Print("Done Scanning! Run: 'exploits' for the found vulns")
end function

Commands["exploits"] = {"Name": "exploits","Description": "Lists all found vulns.","Args": ""}
Commands["exploits"]["Run"] = function(args,pipe)
	idx = 0
	for vul in globals.H
		Print(C.lc+"<b>IP: </b>"+C.e+vul.metaLib.public_ip)
		Print(C.lc+"<b>Local IP: </b>"+C.e+vul.metaLib.local_ip)
		Print(C.lc+"<b>Port: </b>"+C.e+vul.metaLib.port_number)
		Print(C.lc+"<b>Lib: </b>"+C.e+vul.metaLib.metaLib.lib_name)
		Print(C.lc+"<b>Lib Version: </b>"+C.e+vul.metaLib.metaLib.version)
		Print(C.lc+"<b>Exploits:</b>")
		for m in vul.metaLib
			for exploitObj in vul.exploits
				if typeof(exploitObj) == "shell" or typeof(exploitObj) == "ftpshell" then
					idx=idx+1
					Print(t.t+"		<b>["+str(idx)+"]"+C.e+":</b> <i>Shell</i> ("+uparse(getUser(exploitObj.host_computer))+"</color>)")
				else if typeof(exploitObj) == "computer" then
					idx=idx+1
					Print(t.t+"		<b>["+str(idx)+"]"+C.e+":</b> <i>Computer</i> ("+uparse(getUser(exploitObj))+"</color>)")
				else if typeof(exploitObj) == "file" then
					idx=idx+1
					fo = NavToRoot(exploitObj)
					Print(t.t+"		<b>["+str(idx)+"]"+C.e+":</b> <i>File</i> ("+uparse(getUser(fo,1))+C.e+")")
				end if
			end for
		end for
		Print("\n")
	end for
end function

Commands["use"] = {"Name": "use","Description": "Uses a vuln.","Args": "[id]"}
Commands["use"]["Run"] = function(args,pipe)
	idx = 0
	for vul in globals.H
		for m in vul.metaLib
			for exploitObj in vul.exploits
				if typeof(exploitObj) == "shell" or typeof(exploitObj) == "ftpshell" then
					idx=idx+1
				else if typeof(exploitObj) == "computer" then
					idx=idx+1
				else if typeof(exploitObj) == "file" then
					idx=idx+1
				end if
			end for
		end for
	end for

	if args[0].to_int > idx then
		return Print("Invalid ID")
	end if
	
	idx=0
	for vul in globals.H
		for m in vul.metaLib
			for exploitObj in vul.exploits
				if typeof(exploitObj) == "shell" or typeof(exploitObj) == "ftpshell" then
					idx=idx+1
					if args[0].to_int == idx then
						return getShell(exploitObj)
					end if
				else if typeof(exploitObj) == "computer" then
					idx=idx+1
					if args[0].to_int == idx then
						return getShell(exploitObj)
					end if
				else if typeof(exploitObj) == "file" then
					idx=idx+1
					if args[0].to_int == idx then
						while 1
							choices = ["\n\n<b>Options:</b>"]
							choices.push(t.c+"Browse through the files.")
							choices.push(t.c+"Scan entire machine for passwords (and crack them)")
							choices.push(t.c+"Scan entire machine for vulnerable directories and files")
							choices.push(t.e+"Go Back.")
							choice = get_choice(choices, choices.len-1)
							if choice == choices.len-1 then break
							if choice == 1 then
								browseFiles(exploitObj)
							else if choice == 2 then
								while exploitObj.parent
									exploitObj = exploitObj.parent
								end while
								crackAllFiles(exploitObj)
								Print("Cracked passwords have been saved in <b><i>"+home_dir+"/crackedPasswords.txt</b></i>")
							else if choice == 3 then
								while exploitObj.parent
									exploitObj = exploitObj.parent
								end while
								findUnlocked(exploitObj)
							end if
						end while
					end if
				end if
			end for
		end for
	end for
end function

Commands["sys"] = {"Name": "sys","Description": "System shell.","Args": ""}
Commands["sys"]["Run"] = function(params,pipe)

	system_shell = function()
		
		
		message = user_input("\n"+t.bd+"NamelessOS [SYSTEM]"+C.e+t.p+" $ "+t.i)
		args = message.split(" ")
		
		if args[0] == "commands" or args[0] == "help"  then
			Print("\n"+L.c+t.t+"System Commands:"+C.e+"\n")
			
			Print(L.bc+"secure -> Removes programs/files that introduce security issues also chmods the system.")
			Print(L.bc+"decipher [file] -> Decipher tool.\n")
			Print(L.bc+"exit -> Exits the shell.\n")
			Print(L.bc+"help/commands -> Lists all commands.\n")
			
			Print(L.bc+"<i>More soon..</i>\n")
			
			
		end if
		
		
		if args[0] == "decipher" then
			crypto = loadLibrary("crypto.so")
			if not crypto then return error("Error: Can't find crypto library")
			
			filename = args[1]
			file = globals.shell.host_computer.File(filename)
			if not file == null then
				
				logins = file.get_content.split("\n")
				for login in logins
					info = login.split(":")
					accnum = info[0]
					hash = info[1]
					got = crypto.decipher(hash)
					Print(accnum+" -> "+got)
				end for
				
			end if
			
		end if
		
		if args[0] == "secure" then
			
			if not globals.usr == "root" then
				Print(t.e+"NamelessOS cannot be sure that this command worked due to no root access"+C.e)	
			end if
			
			securesys(globals.shell)

			Print(t.s+"NamelessOS has secured this machine.")
			Print(t.e+"You have too run sudo an get root before you can do anything or your machine"+C.e)
		end if
		
		
		if args[0] == "exit" then
			return
		end if
		
		
		system_shell
	end function

	return system_shell
end function

if globals.ar then Commands[globals.ar].Run([],null)

clear_screen

menu = function()
	
	namelessos = function()
		globals.disable_print = false
		cmdpTOP= "\n"+t.bd+"<s>•	</s> (" + uparse(usr) + t.p+"@"+t.ip+ comp.public_ip + "~" + comp.local_ip + t.bd + ")<s> </s>["+t.pa+ pparse(globals.ppath) +t.bd+"]"
		cmdpBTM= "\n"+t.bd+"<s>•		•</s>"+t.p+" $ " +C.e+t.i
		input = user_input(cmdpTOP+cmdpBTM)

		cmds = input.split(";")
		if cmds.len == 0 then cmds.push(input)

		for cmd in cmds
			pipes = cmd.split(":")
			if pipes.len == 0 then pipes.push(cmd)
			globals.lout = null

			cpipe = 1
			for pipe in pipes
				globals.disable_print = true
				if cpipe == pipes.len then
					globals.disable_print = false
				else
					cpipe=cpipe+1
				end if

				args = pipe.split(" ")
				cmdn = args[0].lower

				args.pull
				if Commands.hasIndex(cmdn) then
					cmd = Commands[cmdn]
					Args = cmd.Args.trim.replace("(opt) ","(opt)").split(" ")

					usa = function()
						msg = t.c+ cmd.Name+" "+t.p+" "+cmd.Args.trim +t.c+" -> "+t.t+ cmd.Description
						
						Print("Usage: "+msg)
						globals.lout = null
					end function

					if cmd.Args.trim == "" then
						if args.len == 1 then
							if args[0] == "-h" or args[0] == "--help" then
								usa
								continue
							end if
						end if

						globals.lout = cmd.Run(args,globals.lout)
						continue
					end if

					ta=0
					oa=0
					ra=0
					for arg in Args
						arg=arg.replace("[","")
						arg=arg.replace("]","")

						if arg.indexOf("(opt)") == 0 then
							oa=oa+1
						else
							ra=ra+1
						end if
						ta=ta+1
					end for
					
					if globals.lout != null then
						if ra == 1 and args.len < ra then
							args.push(globals.lout)
						end if
						ra=ra-1
						oa=oa+1
					end if
					
					if (args.len < ra or args.len > ta) then
						usa
					else
						if args.len == 1 then
							if args[0] == "-h" or args[0] == "--help" then
								usa
								continue
							end if
						end if

						globals.lout = cmd.Run(args,globals.lout)
					end if
				else
					error("Command not found!")
				end if
			end for
		end for
		

		namelessos
	end function
	namelessos
	
	menu
end function

menu
