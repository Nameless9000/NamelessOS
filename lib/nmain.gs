authentication = function()
	clear_screen
	x1=str(floor((rnd * 10)))
	x2=str(floor((rnd * 10)))
	x3=str(floor((rnd * 10)))
	x4=str(floor((rnd * 10)))
	OTP = x1+x2+x3+x4

	passwd = "Password: "+char(10)+"Not found"

	if comp.File("/etc/passwd") then
		if comp.File("/etc/passwd").has_permission("r") then
			passwd = "Password: "+char(10)+comp.File("/etc/passwd").get_content
		end if
	end if


	ip = lip
	if lip == ipProtect then
		ip = "hidden"
		passwd = "Password: "+char(10)+"Hidden"
	end if

	message="Attempted login attempt from "+getUser(comp)+"@"+ip+"@"+lan+char(10)+passwd+char(10)+char(10)+"Authentication Code: "+OTP

	mail = mail_login(globals.email.user,globals.email.password)
	mail.send(globals.email.user, OTP, message)

	Print("\n"+t.o+"[NamelessOS Authentication "+namelessos_version+"]"+C.e)
	inputOPT = user_input(t.o+"Enter OTP: "+C.e)

	if inputOPT == OTP then return

	exit("Access Denied!")
end function

authentication

Print(t.o+"NamelessOS Loaded!\n\n"+C.e)

globals.ppath = pparse(path)
globals.db_shell = get_shell.connect_service(globals.config.db,22,"root",globals.config.db_pass)

if not db_shell then
	error("CRITICAL ERROR DATABASE NOT FOUND!")
	exit("Process terminated")
end if

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

Commands = {}

Commands["help"] = {"Name": "help","Description": "List all commands.","Args": "","Shell":false}
Commands["help"]["Run"] = function(args,pipe)
	Ret = "\n"+C.g+"Commands:"+C.e+"\n"

	for Command in Commands
		CData = Command.value
		if CData.Shell == 1 and globals.shellType == "computer" then continue

		Ret = Ret+"		"+C.lc+ CData.Name +C.y+" "+ CData.Args.trim +C.lc+" -> "+C.o+ CData.Description+"\n"
	end for

	return Print(Ret)
end function

Commands["man"] = {"Name": "man","Description": "Shows description and args for command.","Args": "[command]","Shell":false}
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

Commands["ls"] = {"Name": "ls","Description": "List all files.","Args": "[(opt) path]","Shell":false}
Commands["ls"]["Run"] = function(args,pipe)
	computer = globals.comp
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

Commands["search"] = {"Name": "search","Description": "Searches for files or directorys you have access to.","Args": "[(opt) name]","Shell":false}
Commands["search"]["Run"] = function(args,pipe)
	if args.len == 0 and pipe then args.push(pipe)
	if args.len == 0 then args.push("*")
	file = args[0]

	files = rm_dupe(FindFile(file,globals.comp))
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

Commands["find"] = {"Name": "find","Description": "Finds a file or directory.","Args": "[(opt) name]","Shell":false}
Commands["find"]["Run"] = function(args,pipe)
	if args.len == 0 and pipe then args.push(pipe)
	if args.len == 0 then args.push("*")
	file = args[0]

	files = rm_dupe(FindFile(file,globals.comp))
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

Commands["ps"] = {"Name": "ps","Description": "Shows the active processes of the operating system.","Args": "","Shell":false}
Commands["ps"]["Run"] = function(args,pipe)
	procs = globals.comp.show_procs
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

Commands["pwd"] = {"Name": "pwd","Description": "Prints current directory.","Args": "","Shell":false}
Commands["pwd"]["Run"] = function(args,pipe)
	Print(C.o+globals.path)
	return globals.path
end function

Commands["haslib"] = {"Name": "hasLib","Description": "Lib check.","Args": "[lib]","Shell":false}
Commands["haslib"]["Run"] = function(args,pipe)
	crypto = include_lib(args[0])
	return Print(crypto)
end function

Commands["db"] = {"Name": "db","Description": "Logs into the db.","Args": "","Shell":true}
Commands["db"]["Run"] = function(args,pipe)
	sh = globals.shell.connect_service(globals.config.db, 22, "root", globals.config.db_pass, "ssh")
	if not sh then return error("Invalid password!")
	securesys(sh.host_computer)
	return getShell(sh)
end function

Commands["cd"] = {"Name": "cd","Description": "Moves to a different directory.","Args": "[path]","Shell":false}
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

Commands["shell"] = {"Name": "shell","Description": "Starts a normal shell.","Args": "","Shell":true}
Commands["shell"]["Run"] = function(args,pipe)
	return globals.shell.start_terminal()
end function

Commands["vpn"] = {"Name": "vpn","Description": "Randomizes your ip and makes the trace longer.","Args": "","Shell":true}
Commands["vpn"]["Run"] = function(params,pipe)
	globals.proxys.shuffle

	sh = null

	connect = function(ip,pass,pipe)
		info("Routing...")
		remote = globals.shell.connect_service(ip, 22, "root", pass, "ssh")
		if remote then
			securesys(remote.host_computer)
			getShell(remote)
			
			info("Routed!")
		end if
		
		return sh
	end function

	for data in globals.proxys
		connect(data["ip"],data["password"])
	end for

	if sh then
		securesys(sh.host_computer)
		return getShell(sh)
	end if
end function

Commands["clear"] = {"Name": "clear","Description": "Delete any text from the terminal.","Args": "","Shell":false}
Commands["clear"]["Run"] = function(args,pipe)
	return clear_screen
end function

Commands["exit"] = {"Name": "exit","Description": "Exits from NamelessOS.","Args": "","Shell":false}
Commands["exit"]["Run"] = function(args,pipe)
	return exit("Exiting NamelessOS...")
end function

Commands["escalate"] = {"Name": "escalate","Description": "Escalates your shell permissions.","Args": "[(opt) local ip]","Shell":false}
Commands["escalate"]["Run"] = function(args,pipe)
	localip = globals.comp.local_ip
	if args.len == 1 then localip = args[0]
	
	startev = function()
		cryptools = loadLibrary("crypto.so",true)
		if not cryptools then return error("Can't find crypto library")

		metaxploit = loadLibrary("metaxploit.so",true)
		if not metaxploit then return error("Can't find metaxploit library")

		GetPassword = function(userPass)
			if userPass.len != 2 then return error("wrong syntax")
			password = cryptools.decipher(userPass[1])
			if password then
				return password
			else
				return null
			end if
		end function

		passwds = FindFile("passwd",globals.comp)
		for passwd in passwds
			if passwd != null then
				cont = passwd.split(char(10))
				for c in cont
					cc = c.split(":")
					if cc.len == 2 then
						if cc[0] == "root" then
							p = GetPassword(cc)
							if p then
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

		libs = FindFile("*.so",globals.comp)
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
								ps.push(localip)
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
						if type == "shell" and res.host_computer.local_ip == localip then
							return getShell(res)
						end if

						if type == "number" then
							info("Password changed to '"+globals.config.passwdChange+"'")
						end if

						if type == "file" then
							Root = NavToRoot(res)

							passwds = FindFile("passwd",res)
							for passwd in passwds
								if passwd and passwd != null then
									Print(passwd)
									cont = passwd.split(char(10))
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

						if type == "computer" and res.local_ip == localip then
							return getShell(res)	
						end if
					end if
				end for
			end for
		end for
	end function

	if globals.usr == "root" and localip == globals.comp.local_ip then
		return Print("You already have root.")
	else
		return startev()
	end if
end function


Commands["getsystem"] = {"Name": "getsystem","Description": "Manual priv esc.","Args": "","Shell":false}
Commands["getsystem"]["Run"] = function(args,pipe)

	cryptools = loadLibrary("crypto.so",true)
	if not cryptools then return error("Can't find crypto library")

	metaxploit = loadLibrary("metaxploit.so",true)
	if not metaxploit then return error("Can't find metaxploit library")

	GetPassword = function(userPass)
		if userPass.len != 2 then return error("wrong syntax")
		password = cryptools.decipher(userPass[1])
		if password then
			return password
		else
			return null
		end if
	end function

	passwd = globals.comp.File("/etc/passwd")
	if passwd != null and passwd.has_permission("r") then
		passwd = passwd.get_content
		cont = passwd.split(char(10))
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
	

	while 1
		libs = FindFile("*.so",globals.comp)
		metas = []
		for lib in libs
			lcomp = globals.comp
			pName = lcomp.File(lib).parent.name
			if pName == "lib" then
				m = metaxploit.load(lib)
				if m != null then
					metas.push( {"public_ip": lcomp.public_ip, "local_ip": lcomp.local_ip, "port_number":-1, "metaLib":m} )
				end if
			end if
		end for
		
		while 1
			metaLib = chooseMetaLib(metas)
			if not metaLib then return
			
			exploits = loadExploits(metaLib.metaLib)
			
			if exploits.len == 0 then
				error("Sorry, there are no exploits for the entry point.  Try scanning for some.")
				print("")
				continue
			end if
			
			break
		end while

		while 1
			choices = ["\n\n<b>Choose which exploit you would like to use:</b>"]
			exploits = loadExploits(metaLib.metaLib)
			for exploit in exploits
				stringToAdd = "<b> " + exploit.type + "</b>"
				if exploit.hasIndex("requirements") then 
					for requirement in exploit.requirements
						stringToAdd = stringToAdd + "\n       " + requirement
					end for
				end if
				choices.push(stringToAdd)
			end for
			choices.push("<i>Back.</i>")

			userChoice = get_choice(choices, choices.len-1)
			if userChoice > exploits.len then break
			exploit = exploits[userChoice-1]

			exploitObj = runExploit(exploit, metaLib.metaLib, "manual")
			
			if typeof(exploitObj) == "shell" or typeof(exploitObj) == "ftpshell" then
				result = get_yesno(false, typeof(exploitObj) + ": Are you sure you want to open it now?")
				if result then
					return getShell(exploitObj)
				end if
			else if typeof(exploitObj) == "computer" then
				result = get_yesno(false, typeof(exploitObj) + ": Are you sure you want to open it now?")
				if result then
					return getShell(exploitObj)
				end if
			else if typeof(exploitObj) == "file" then
				choices = ["\n\n<b>You have unlocked file access.  You can:</b>"]
				choices.push("Browse Files")
				choices.push("Scan entire machine for passwords (and crack them)")
				choices.push("Scan entire machine for vulnerable directories and files")
				choices.push("Nothing.")
				choice = get_choice(choices, choices.len-1)
				if choice == choices.len-1 then break
				if choice == 1 then
					browseFiles(exploitObj)
				else if choice == 2 then
					while exploitObj.parent
						exploitObj = exploitObj.parent
					end while
					crackAllFiles(exploitObj, metaLib.public_ip + " --> " + metaLib.local_ip)
					print("Cracked passwords have been saved in <b><i>" + home_dir + "/crackedPasswords.txt</b></i>")
				else if choice == 3 then
					while exploitObj.parent
						exploitObj = exploitObj.parent
					end while
					findUnlocked(exploitObj)
				end if
			end if
		end while
	end while
end function


Commands["back"] = {"Name": "back","Description": "Goes back to the last shell.","Args": "","Shell":false}
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

Commands["install"] = {"Name": "install","Description": "Uploads the script and libraries to the connected server.","Args": "","Shell":true}
Commands["install"]["Run"] = function(args,pipe)
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
			end if
		else
			Print("Invalid Permissions.")
		end if
	end if
end function

Commands["up"] = {"Name": "up","Description": "Uploads a file.","Args": "[path]","Shell":false}
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

Commands["dl"] = {"Name": "dl","Description": "Downloads a file.","Args": "[path]","Shell":false}
Commands["dl"]["Run"] = function(args,pipe)
	pathFile = args[0]

	file = globals.comp.File(pathFile)
	if file == null then file = globals.comp.File(path+"/"+pathFile)
	if file == null then return error("file not found: "+pathFile)

	Print("Saving file to: /root/Downloads/"+file.name)
	x = globals.shell.scp(file.path, "/root/Downloads", globals.hs)
	if(x == 1) then
		return Print("File downloaded successfully.")
	else
		return error(x)
	end if
end function

Commands["cat"] = {"Name": "cat","Description": "Shows the contents of a text file.","Args": "[file]","Shell":false}
Commands["cat"]["Run"] = function(params,pipe)
	pathFile = params[0]
	if pipe then pathFile = pipe
	file = globals.comp.File(pathFile)
	if file == null then file = globals.comp.File(path+"/"+pathFile)
	if file == null then return error("file not found: "+pathFile)
	if file.is_binary then return error("can't open "+file.path+". Binary file")	
	if not file.has_permission("r") then return error("permission denied")

	return Print(file.get_content)
end function

Commands["rm"] = {"Name": "rm","Description": "Delete any file if you have the appropriate permissions.","Args": "[(opt) -r] [file]","Shell":false}
Commands["rm"]["Run"] = function(args,pipe)
	pathFile = args[0]
	if pipe then pathFile = pipe
	isRecursive = 0
	if args[0] == "-r" then
		isRecursive = 1
		pathFile = args[1]
	end if
	file = globals.comp.File(pathFile)
		
	if file == null then return error("file not found: "+pathFile)
	if not file.has_permission("w") then return error("permission denied")
	if file.is_folder == 1 and isRecursive == 0 then
		return error(file.name+" is a directory")
	else
		return file.delete
	end if
end function

Commands["iwlist"] = {"Name": "iwlist","Description": "Shows the list of wifi networks visible from your computer.","Args": "","Shell":false}
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

Commands["wifi"] = {"Name": "wifi","Description": "Hacks the specified wifi or the one with the highest connection.","Args": "[(opt) essid]","Shell":false}
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

Commands["sudo"] = {"Name": "sudo","Description": "It allows users to run programs with administrator security privileges.","Args": "[(opt) -s] [command]","Shell":false}
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

Commands["grep"] = {"Name": "grep","Description": "Looks for text in a string.","Args": "[search] [string]","Shell":false}
Commands["grep"]["Run"] = function(Args,pipe)
	if pipe then Args.push(pipe)
	search = Args[0]
	input = Args[1]

	if input.split(char(10)).len != 0 then
		lines = input.split(char(10))
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

Commands["crack"] = {"Name": "crack","Description": "Cracks a hash.","Args": "[hash]","Shell":false}
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

Commands["sniff"] = {"Name": "sniff","Description": "The terminal listens to the network packets of any connection that passes through this device.","Args": "[(opt) saveEncSource]","Shell":false}
Commands["sniff"]["Run"] = function(params,pipe)

	metaxploit = loadMetaXPloit()
	if not metaxploit then return error("Can't find metaxploit library")

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

Commands["kernel.panic"] = {"Name": "kernel.panic","Description": "Destroy everything (requires reboot).","Args": "","Shell":false}
Commands["kernel.panic"]["Run"] = function(params,pipe)
	reboot = null

	if globals.comp.File("/boot") and globals.comp.File("/boot").has_permission("w") then
		globals.comp.File("/boot").delete
	end if
	
end function

Commands["forkbomb"] = {"Name": "forkbomb","Description": "Fills up the ram.","Args": "","Shell":false}
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

Commands["files"] = {"Name": "files","Description": "File browser.","Args": "","Shell":false}
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
			crackAllFiles(globals.comp.File("/"))
			Print("Cracked passwords have been saved in <b><i>"+home_dir+"/crackedPasswords.txt</b></i>")
		else if choice == 6 then
			findUnlocked(globals.comp.File("/"))
		end if
	end while
end function

Commands["nmap"] = {"Name": "nmap","Description": "Scans an ip/domain for ports and local ips.","Args": "[ip/domain]","Shell":false}
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

Commands["router"] = {"Name": "router","Description": "Scans the router for firewall rules.","Args": "[ip]","Shell":false}
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

Commands["ssh"] = {"Name": "ssh","Description": "Access to private servers through a back door.","Args": "[user@password] [ip] [(opt) port]","Shell":true}
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

Commands["masterkey"] = {"Name": "masterkey","Description": "lol this is just op (if u have access)","Args": "[ip] [port]","Shell":false}
Commands["masterkey"]["Run"] = function(args,pipe)
	if pipe then args[0] = pipe

	ip = args[0]
	port = args[1].to_int

	if typeof(port) != "number" then return error("Invalid port: "+port)
	remote = globals.shell.masterkey(ip, port)
	if remote then
		wlsys(remote)
		return getShell(remote)
	end if
	
end function

Commands["echo"] = {"Name": "echo","Description": "Prints text.","Args": "[text]","Shell":false}
Commands["echo"]["Run"] = function(args,pipe)
	if pipe then args[0] = pipe
	text = args[0]
	Print(text)
	return text
end function

Commands["secure"] = {"Name": "secure","Description": "Secures the connected system.","Args": "","Shell":false}
Commands["secure"]["Run"] = function(args,pipe)
	securesys(globals.comp)
end function

Commands["manual"] = {"Name": "manual","Description": "Manual scanning.","Args": "[ip/domain]","Shell":false}
Commands["manual"]["Run"] = function(args,pipe)
	ip = args[0]
	port = null
	ipAddr = null
	localIp = null

	globals.H = []

	if not is_valid_ip(ip) then
		if is_valid_ip(nslookup(ip)) then
			ip = nslookup(ip)
		else
			return error("IP not found!")
		end if
	end if
	ipAddr = ip

		
	while 1
		if is_lan_ip(ipAddr) then
			displayLocalMap(ipAddr)
			metaLibs = extractMetaLibs(ipAddr)
		else
			router = getRouter(ipAddr)
			displayRouterMap(router)
			metaLibs = extractMetaLibs(router)
		end if
		
		while 1
			metaLib = chooseMetaLib(metaLibs)
			if not metaLib then exit("Thanks for using NamelessOS")
			
			exploits = loadExploits(metaLib.metaLib)
			
			if exploits.len == 0 then
				error("Sorry, there are no exploits for the entry point.  Try scanning for some.")
				print("")
				continue
			end if
			
			break
		end while

		while 1
			choices = ["\n\n<b>Choose which exploit you would like to use:</b>"]
			exploits = loadExploits(metaLib.metaLib)
			for exploit in exploits
				stringToAdd = "<b> " + exploit.type + "</b>"
				if exploit.hasIndex("requirements") then 
					for requirement in exploit.requirements
						stringToAdd = stringToAdd + "\n       " + requirement
					end for
				end if
				choices.push(stringToAdd)
			end for
			choices.push("<i>Back.</i>")

			userChoice = get_choice(choices, choices.len-1)
			if userChoice > exploits.len then break
			exploit = exploits[userChoice-1]

			exploitObj = runExploit(exploit, metaLib.metaLib, "manual")
			
			if typeof(exploitObj) == "shell" or typeof(exploitObj) == "ftpshell" then
				result = get_yesno(false, typeof(exploitObj) + ": Are you sure you want to open it now?")
				if result then
					return getShell(exploitObj)
				end if
			else if typeof(exploitObj) == "computer" then
				result = get_yesno(false, typeof(exploitObj) + ": Are you sure you want to open it now?")
				if result then
					return getShell(exploitObj)
				end if
			else if typeof(exploitObj) == "file" then
				choices = ["\n\n<b>You have unlocked file access.  You can:</b>"]
				choices.push("Browse Files")
				choices.push("Scan entire machine for passwords (and crack them)")
				choices.push("Scan entire machine for vulnerable directories and files")
				choices.push("Nothing.")
				choice = get_choice(choices, choices.len-1)
				if choice == choices.len-1 then break
				if choice == 1 then
					browseFiles(exploitObj)
				else if choice == 2 then
					while exploitObj.parent
						exploitObj = exploitObj.parent
					end while
					crackAllFiles(exploitObj, metaLib.public_ip + " --> " + metaLib.local_ip)
					print("Cracked passwords have been saved in <b><i>" + home_dir + "/crackedPasswords.txt</b></i>")
				else if choice == 3 then
					while exploitObj.parent
						exploitObj = exploitObj.parent
					end while
					findUnlocked(exploitObj)
				end if
			end if
		end while
	end while
end function

Commands["scan"] = {"Name": "scan","Description": "Scans an ip/domain for vulns.","Args": "[ip/domain] [(opt) port] [(opt) local ip]","Shell":false}
Commands["scan"]["Run"] = function(args,pipe)
	ip = args[0]
	port = null
	ipAddr = null
	localIp = null

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
	if args.len == 3 then
		port = args[1]
		localIp = args[2]
	end if
	
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
		if port then
			if str(metaLib.port_number) != str(port) then continue
		end if

		if loadExploits(metaLib.metaLib).len == 0 then
			scanTarget(metaLib.metaLib)
		end if
		exploits = loadExploits(metaLib.metaLib)
		
		localIp = metaLibs.local_ip
		if args.len == 3 then localIp = args[2]

		exps = []
		for exploit in exploits
			exploitObj = runExploit(exploit, metaLib.metaLib, localIp)
			exps.push(exploitObj)
		end for

		globals.H.push({"exploits":exps,"metaLib":metaLib})
	end for

	return Print("Done Scanning! Run: 'exploits' for the found vulns")
end function

Commands["exploits"] = {"Name": "exploits","Description": "Lists all found vulns.","Args": "","Shell":false}
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

Commands["use"] = {"Name": "use","Description": "Uses a vuln.","Args": "[id]","Shell":false}
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

Commands["nc"] = {"Name":"nc","Description":"Netcat used for rshells","Args":"[(opt) command] [(opt) option] [(opt) ip] [(opt) port]","Shell":false}
Commands["nc"]["Run"] = function(params,pipe)
	metaxploit = loadMetaXPloit
	
	if not metaxploit then return error("metaxploit.so not found!")
	
	if params.len < 1 then
		return Print("Netcat\n\nnc -nlvp PORT | nc -lvnp PORT -- Listen for connections\nnc -c bash IP PORT | nc -c bash IP PORT -- Start terminal")
	end if
	
	checkForRShell = function(ipAddr, checkPort)
		router = get_router(ipAddr)
		ports = router.used_ports
		
		if ports == null then return false
		if typeof(ports) == "string" then return false
		
		if(ports.len == 0) then return false
	
		for port in ports
			service_info = router.port_info(port)
			lan_ips = port.get_lan_ip
	
			if str(port.port_number) == checkPort then return true
		end for
	
		return false
	end function
	
	if params.len == 2 or params.len == 1 then
		opt = params[0]
	
		oopt = opt
		opt.remove("-")

		if opt.indexOf("-") == -1 then return error("unknown command")
		if opt.indexOf("l") == -1 then return error("unknown command")
		if opt.indexOf("v") == -1 then return error("unknown command")
		if opt.indexOf("n") == -1 then return error("unknown command")

		ipAddr = globals.comp.public_ip
		fileName = globals.comp.File(program_path).name

		if opt.indexOf("p") == -1 then
			print(fileName+": listening ...")
		else
			if params.len == 1 then return error("unknown command")

			port = params[1]
			if checkForRShell(ipAddr, port) == false then return error("port not found")

			print(fileName+": listening on "+ipAddr+" "+port+" ...")
		end if

		shells = []
		while shells.len == 0	
			shells = metaxploit.rshell_server
			if(typeof(shells) == "string") then return error(shells)	
			if(shells.len == 0) then wait(2)
		end while

		shell = shells[0]

		scomp = shell.host_computer

		print(fileName+": connected to "+scomp.public_ip+" : "+scomp.local_ip)

		output = scomp.show_procs
		lines = output.split(char(10))
		for line in lines
			proc = line.split(" ")
			id = proc[1]
			pName = proc[4]

			if pName == "dsession" then
				scomp.close_program(id.to_int)
			end if
		end for

		getShell(shell)
	end if
	
	if params.len == 4 then
		opt = params[0]
		cmd = params[1]
		ip = params[2]
		port = params[3]
	
		if opt == "-c" and cmd == "bash" then
			if checkForRShell(ip, port) == false then return error("ip/port not found")
	
			output = metaxploit.rshell_client(ip, port.to_int, "dsession")
			if output != 1 then return error(output)
	
			return
		end if
	end if
	
	return error("unknown command")
end function

Commands["sys"] = {"Name": "sys","Description": "System shell.","Args": "","Shell":false}
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
			crypto = loadLibrary("crypto.so",true)
			if not crypto then return error("Can't find crypto library")
			
			filename = args[1]
			file = globals.comp.File(filename)
			if not file == null then
				
				logins = file.get_content.split(char(10))
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
			
			securesys(globals.comp)

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

parseCmd = function(input)
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

				if cmd.Shell == 1 and globals.shellType == "computer" then
					error("A shell is required for this command.")
				end if

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
end function

if globals.ar then parseCmd(globals.ar)

clear_screen

menu = function()
	
	namelessos = function()
		globals.disable_print = false
		ip = comp.public_ip
		if ip == ipProtect then ip = "hidden"
		cmdpTOP= "\n"+t.bd+"<s>•	</s> ("+uparse(usr)+t.p+":</color>"+globals.shellType+t.p+"@"+t.ip+ip+ "~" + comp.local_ip + t.bd + ")<s> </s>["+t.pa+ pparse(globals.ppath) +t.bd+"]"
		cmdpBTM= "\n"+t.bd+"<s>•		•</s>"+t.p+" $ " +C.e+t.i
		input = user_input(cmdpTOP+cmdpBTM)

		parseCmd(input)

		namelessos
	end function
	namelessos
	
	menu
end function

menu
