extends XROrigin3D

@export var default_height = 1.8 # Default height if not overridden by VR system

func _ready():
	var openxr_interface = XRServer.find_interface("OpenXR")
	if openxr_interface and openxr_interface.is_initialized():
		print("OpenXR interface initialized successfully.")

		# Set the display name for the viewport
		# This helps in identifying the viewport in debugging tools
		get_viewport().set_name("OpenXRViewport")

		# Set the primary flag for the interface if it's not already
		if not openxr_interface.is_primary():
			openxr_interface.set_primary(true)

		# Adjust origin height based on tracking, or use default
		# The actual camera height will be determined by the HMD's pose
		# This script assumes the XROrigin3D is at floor level (Y=0)
		# The XRCamera3D inside XROrigin3D is typically set at an eye-level offset
		# or its height is directly controlled by the HMD.
		# For room-scale, the origin y should be 0.
		# For seated/standing, it might be adjusted.
		# We'll assume room-scale for now, so origin y=0.
		self.position.y = 0

		# The XRCamera3D's height within XROrigin3D will be automatically
		# handled by the XR system based on the HMD's position relative
		# to the tracked space.

		print("VR Setup Complete. Origin at Y=0 for room scale.")

	else:
		printerr("OpenXR interface failed to initialize.")
		# Optionally, you could try to switch to a non-VR mode here
		# or display a message to the user.
		# For now, we just print an error.
		get_tree().quit() # Quit the application if VR fails for this demo

func _process(_delta):
	# You can add per-frame VR logic here if needed
	pass
