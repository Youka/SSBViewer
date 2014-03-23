<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
</head>
<body>
<h1>Available samples:</h1>
<?PHP
$files = scandir("workspace");
if($files)
	foreach($files as $file)
		if(substr($file, -4) === ".png")
			echo $file . "<br><img src='workspace/" . $file . "' /><hr>";
?>
</body>
</html>