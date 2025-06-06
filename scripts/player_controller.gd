extends CharacterBody3D

@export var mouse_sensitivity: float = 0.002
@export var move_speed: float = 5.0
@export var gravity: float = 9.8

@onready var camera: Camera3D = $Camera3D

func _ready():
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _unhandled_input(event: InputEvent):
	if event is InputEventMouseMotion:
		# Yaw (left/right) rotation for the player body
		self.rotate_y(-event.relative.x * mouse_sensitivity)
		# Pitch (up/down) rotation for the camera
		camera.rotate_x(-event.relative.y * mouse_sensitivity)
		# Clamp camera pitch
		camera.rotation.x = clamp(camera.rotation.x, -PI/2, PI/2)

func _physics_process(delta: float):
	var input_dir := Vector3.ZERO

	if Input.is_action_pressed("move_forward"):
		input_dir.z -= 1
	if Input.is_action_pressed("move_backward"):
		input_dir.z += 1
	if Input.is_action_pressed("move_left"):
		input_dir.x -= 1
	if Input.is_action_pressed("move_right"):
		input_dir.x += 1

	# Normalize direction vector if it's not zero
	if input_dir != Vector3.ZERO:
		input_dir = input_dir.normalized()

	# Apply player's rotation to the direction vector
	# This makes movement relative to where the player is looking (local space)
	var direction = input_dir.rotated(Vector3.UP, self.rotation.y)

	# Apply gravity
	if not is_on_floor():
		velocity.y -= gravity * delta

	# Apply movement
	velocity.x = direction.x * move_speed
	velocity.z = direction.z * move_speed

	move_and_slide()
