using Godot;

public partial class PlayerController : CharacterBody3D
{
    [Export]
    public float MouseSensitivity { get; set; } = 0.002f; // Radians per pixel
    [Export]
    public float MovementSpeed { get; set; } = 5.0f;
    [Export]
    public float JumpVelocity { get; set; } = 4.5f;
    [Export]
    public float Gravity { get; set; } = 9.8f;

    private Camera3D _camera;
    private Vector3 _velocity = Vector3.Zero;

    public override void _Ready()
    {
        _camera = GetNode<Camera3D>("Camera");
        Input.MouseMode = Input.MouseModeEnum.Captured;
    }

    public override void _Input(InputEvent @event)
    {
        if (@event is InputEventMouseMotion mouseMotion && Input.MouseMode == Input.MouseModeEnum.Captured)
        {
            // Horizontal rotation (around Y axis) for the CharacterBody3D
            RotateY(-mouseMotion.Relative.X * MouseSensitivity);
            // Vertical rotation for the Camera3D
            _camera.RotateX(-mouseMotion.Relative.Y * MouseSensitivity);

            // Clamp vertical rotation
            Vector3 cameraRotation = _camera.RotationDegrees;
            cameraRotation.X = Mathf.Clamp(cameraRotation.X, -90f, 90f);
            _camera.RotationDegrees = cameraRotation;
        }
    }

    public override void _PhysicsProcess(double delta)
    {
        Vector3 targetVelocity = Vector3.Zero;

        // Handle movement input
        Vector2 inputDir = Input.GetVector("left", "right", "forward", "backward");
        Vector3 direction = (Transform.Basis * new Vector3(inputDir.X, 0, inputDir.Y)).Normalized();

        if (direction != Vector3.Zero)
        {
            targetVelocity.X = direction.X * MovementSpeed;
            targetVelocity.Z = direction.Z * MovementSpeed;
        }
        else
        {
            targetVelocity.X = Mathf.MoveToward(_velocity.X, 0, MovementSpeed);
            targetVelocity.Z = Mathf.MoveToward(_velocity.Z, 0, MovementSpeed);
        }

        // Apply gravity
        if (!IsOnFloor())
        {
            _velocity.Y -= Gravity * (float)delta;
        }
        else if (Input.IsActionJustPressed("jump")) // Handle Jump
        {
            _velocity.Y = JumpVelocity;
        }


        _velocity.X = targetVelocity.X;
        _velocity.Z = targetVelocity.Z;

        Velocity = _velocity;
        MoveAndSlide();
        _velocity = Velocity; // Update velocity after MoveAndSlide
    }
}
