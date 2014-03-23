<?PHP
class TmpFile{
	private $filename;
	function __construct($prefix = ""){
		$this->filename = tempnam("/tmp", $prefix);
	}
	function __destruct(){
		unlink($this->filename);
	}
	public function getName(){
		return $this->filename;
	}
}

function timeout_exec($cmd, $stdin = "", &$stdout, &$stderr, $timeout = 0){
	// Initialize output
	$stdout = "";
	$stderr = "";
	// Start process
	$pipes = array();
	$process = proc_open($cmd, array(array('pipe','r'),array('pipe','w'),array('pipe','w')), $pipes);
	if(!is_resource($process))
		return 1;
	else{
		// Set non-blocking streams
		stream_set_blocking($pipes[0], 0);
		stream_set_blocking($pipes[1], 0);
		stream_set_blocking($pipes[2], 0);
		// Insert input
		fwrite($pipes[0], $stdin);
		fclose($pipes[0]);
		// Check process run with timeout
		$start = microtime(true) * 1000;
		while($timeout <= 0 || microtime(true) * 1000 - $start < $timeout){
			// Update output
			$stdout .= stream_get_contents($pipes[1]);
			$stderr .= stream_get_contents($pipes[2]);
			// Check process status
			$status = proc_get_status($process);
			if(!$status['running']){
				fclose($pipes[1]);
				fclose($pipes[2]);
				proc_close($process);
				return $status['exitcode'];
			}
			// Wait 1ms for better performance
			usleep(1000);
		}
		// Timeout expired
		fclose($pipes[1]);
		fclose($pipes[2]);
		proc_terminate($process);
		return -1;
	}
}
?>