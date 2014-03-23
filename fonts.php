<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
</head>
<body>
<h1>Available fonts:</h1>
<?PHP
$out = array();
if(strtolower(substr(PHP_OS,0,3)) === "win"){
	exec('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts"', $out);
	foreach($out as $i=>&$font){
		$pos = strrpos($font, "REG_SZ");
		if($pos)
			$font = trim(substr($font, 0, $pos));
		else
			unset($out[$i]);
	}
}else{
	exec("fc-list", $out);
	foreach($out as &$font){
		$pos = strrpos($font, ":");
		$font = $pos ? "<b>" . substr($font, 0, $pos) . "</b>" . substr($font, $pos) : "<b>" . $font . "</b>";
	}
}
sort($out);
echo implode("<br>", $out);
?>
</body>
</html>