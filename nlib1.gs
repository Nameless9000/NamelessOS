
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

Print(t.o+"NamelessOS Loaded!\n\n"+C.e)

wlsys = function(ccomp)
	if globals.config.deleteLogs == true then
		log = ccomp.File("/var/system.log")
		if not log == null then
			log.delete
		end if
	end if
end function

securesys = function(ccomp)
	pwd = ccomp.File("/etc/passwd")
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

	sshd = ccomp.File("/server/conf/sshd.conf")
	if sshd and sshd.has_permission("w") then
		t = "{""encryption_enabled"": true,\n""message_encrypted_conn"": true,\n""path_enc"": ""/server/encode.src"",\n""path_dec"": ""/server/decode.bin""\n}"
		sshd.set_content(t)
	end if

	gues = ccomp.File("/home/guest")
	if not gues == null then
		gues.delete
	end if

	crypt = ccomp.File("/lib/crypto.so")
	if not crypt == null then
		crypt.move("/root","crypto.so")
	end if

	home = ccomp.File("/home")
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

	wlsys(ccomp)

	ccomp.File("/").set_owner("root",1)
	ccomp.File("/").set_group("root",1)
	ccomp.File("/").chmod("o-wrx",1)
	ccomp.File("/").chmod("u-wrx",1)
	ccomp.File("/").chmod("g-wrx",1)
	
	ccomp.File("/bin/sudo").chmod("g+x")
	ccomp.File("/usr/bin/Terminal.exe").chmod("g+x")
end function

globals.db_shell = get_shell.connect_service(globals.config.db,22,"root",globals.config.db_pass)
clear_screen
if globals.config.deleteLogs == true then
	log = hs.host_computer.File("/var/system.log")
	if not log == null then
		log.delete
	end if
end if
globals.db_pc = globals.db_shell.host_computer
globals.db_ip = globals.config.db

securesys(db_pc)

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
	lines = exploitLibFile.get_content.split("&")
	securesys(db_pc)
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

	file = globals.db_pc.File(filePath+fileName)
	
	outputString = ""
	if not file then
		globals.db_pc.touch(filePath, fileName)
		file = globals.db_pc.File(filePath+fileName)
	end if
	exploits = removeDuplicates(exploits)
	for exploit in exploits
		if exploit.hasIndex("type") then outputString = outputString+"exploit::"+exploit.type+"&"

		for key in exploit.indexes
			value = exploit[key]
			if typeof(value) == "string" then
				outputString = outputString+key+"::"+value+"&"
			else if typeof(value) == "list" then
				for val in value
					outputString = outputString+key+"::"+val+"&"
				end for
			else
				error("writeExploits: Don't know what to do with type: "+typeof(value)+" while writing key: "+key)
				return false
			end if
		end for
		outputString = outputString
	end for
	file.set_content(outputString)
	securesys(db_pc)
end function

scanTarget = function(target)
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
		newEntries = newEntries+"exploit::"+exp.exploit+"&"
		newEntries = newEntries+"memory::"+exp.memory+"&"
		newEntries = newEntries+"string::"+exp.string+"&"
		if exp.hasIndex("requirements") then newEntries = newEntries+"requirements::"+exp.requirements+"&"
		if target.lib_name == "kernel_router.so" or "net.so" then
			newEntries = newEntries+"parameters::Local IP Address&"
		end if
		newEntries = newEntries
	end for
	
	exploitLibFile.set_content(exploitLibFile.get_content+newEntries)
	securesys(db_pc)
	info("library updated.")
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
				if lip == "manual" then
					Print("<b>Additional information needed.  Please answer the following questions</b>")
					ps.push(user_input(parameter+" >"))
				else
					if parameter == "Local IP Address" and lip then
						ps.push(lip)
					else if parameter == "New Password" then
						ps.push(globals.config.passwdChange)
					else
						Print("<b>Additional information needed.  Please answer the following questions</b>")
						ps.push(user_input(parameter+" >"))
					end if
				end if
			end for
		end if

		print(exploit)

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
		if typeof(overflowResult) == "null" or str(overflowResult) == "0" then
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
				return null
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

getShell = function(SHELL)
	globals.shellType = typeof(SHELL)

	globals.ls = globals.shell
	globals.lc = globals.comp
	globals.lrouter = globals.rout
	
	globals.lusr = globals.usr
	globals.llan = globals.lan

	if typeof(SHELL) == "shell" then
		globals.shell = SHELL
		globals.comp = SHELL.host_computer
	end if

	if typeof(SHELL) == "computer" then
		globals.comp = SHELL
	end if
	
	globals.lan = globals.comp.local_ip
	idxp = globals.comp.public_ip

	globals.lip = idxp

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
		log = globals.comp.File("/var/system.log")
		if not log == null and log.has_permission("w") then
			log.delete
		end if
		log = globals.hs.host_computer.File("/var/system.log")
		if not log == null and log.has_permission("w") then
			log.delete
		end if
	end if
	Print(t.o+"Connected!")
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
		else if mRouter.ping_port(externalPort.port_number) and mRouter.ping_port(externalPort.port_number).is_closed then
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


chooseMetaLib = function(metaLibs)
	while 1
		print("\n<b>Found the following entry point(s): </b>")
		c = 0
		for metaLib in metaLibs
			c = c + 1
			if metaLib.port_number == -1 then
				print("<b>[" + c + "] " + metaLib.metaLib.lib_name + "</b> (Version: " + metaLib.metaLib.version + ") --> " + metaLib.local_ip)
			else 
				print("<b>[" + c + "] " + metaLib.metaLib.lib_name + "</b> (Version: " + metaLib.metaLib.version + ") --> " + metaLib.local_ip + ":" + metaLib.port_number)
			end if
			print("     <i>" + loadExploits(metaLib.metaLib).len + " exploits on file.</i>")
		end for
		print("<b>[S]</b> Scan an entry point for exploits.")
		print("<b>[A]</b> Scan ALL entry points for new exploits.")
		print("<b>[X]</b> None.  Exit now.")
	
		print("Which one would you like to use?")
		i = user_input("> ")
		if i.len == 0 then continue
		if i.lower[0] == "x" then return null
		if i.lower[0] == "a" then
			print("Scanning <b>ALL</b> libraries for vulnerabilities")
			for metaLib in metaLibs
				print("Scanning " + metaLib.metaLib.lib_name + ", version " + metaLib.metaLib.version)
				scanTarget(metaLib.metaLib)
			end for
			continue
		end if
		if i.lower[0] == "s" then
			choices = ["Choose which library to scan"]
			for metaLib in metaLibs
				choices.push(metaLib.metaLib.lib_name + ", version " + metaLib.metaLib.version)
			end for
			userChoice = get_choice(choices)
			scanTarget(metaLibs[userChoice-1].metaLib)
			continue
		end if
		i = i.to_int
		if i < 1 or i > c then 
			error("Not a valid response.  Try again")
			continue
		end if
		return metaLibs[i-1]
	end while
end function
