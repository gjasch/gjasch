import UIKit

class ViewController: UIViewController {

    @IBOutlet weak var canvasImageView: UIImageView!
    @IBOutlet weak var colorPaletteCollectionView: UICollectionView!

    let paletteColors: [UIColor] = [
        .red, .green, .blue, .yellow, .orange, .purple, .brown, .cyan, .magenta, .black
    ]
    var selectedColor: UIColor

    // Need to initialize selectedColor before super.viewDidLoad() if used in property initializers,
    // or ensure it's initialized before use. Initializing here is fine.
    // Alternatively, make it optional or give it a default value directly.
    required init?(coder: NSCoder) {
        self.selectedColor = paletteColors.first ?? .black // Default to first color or black
        super.init(coder: coder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        // The main UI elements are now connected via Storyboard.
        // You can further configure them here if needed.

        // Example: Set a placeholder background color for the canvas if not set in Storyboard or for testing
        // canvasImageView.backgroundColor = .lightGray

        // Load the line art image
        if let lineArtImage = UIImage(named: "LineArt") {
            canvasImageView.image = lineArtImage
        } else {
            print("Error: LineArt.png not found.")
        }

        // Enable user interaction for tap gesture
        canvasImageView.isUserInteractionEnabled = true

        // Add tap gesture recognizer
        let tapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(handleCanvasTap(_:)))
        canvasImageView.addGestureRecognizer(tapGestureRecognizer)

        // TODO: Set up the collection view delegate and data source
        colorPaletteCollectionView.delegate = self
        colorPaletteCollectionView.dataSource = self
    }

    @objc func handleCanvasTap(_ gestureRecognizer: UITapGestureRecognizer) {
        let tapPoint = gestureRecognizer.location(in: canvasImageView)
        print("Canvas tapped at: \(tapPoint)")

        // Use the selectedColor from the palette
        floodFill(at: tapPoint, with: selectedColor)
    }

    func floodFill(at point: CGPoint, with color: UIColor) {
        // Placeholder for actual flood fill logic
        // A real flood fill would involve:
        // 1. Getting the pixel color at the tap point from the image.
        // 2. Using a queue-based algorithm (like BFS) to find contiguous pixels of the same color.
        // 3. Replacing those pixels with the new color.
        // This requires direct pixel manipulation of UIImage data, which is complex.

        print("Flood fill called at \(point) with color \(color.description)")

        // Simple visual feedback: change the background color of the image view.
        // In a real app, you'd modify the UIImage data itself.
        // Also, ensure the image view's content mode allows background to be seen if image is smaller.
        // For line art, you might want to render the filled areas onto a new image.
        canvasImageView.backgroundColor = color // Placeholder action
    }
}

// MARK: - UICollectionViewDataSource
extension ViewController: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return paletteColors.count
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "ColorCell", for: indexPath)
        cell.backgroundColor = paletteColors[indexPath.item]

        // Add a border to the selected cell for visual feedback
        if paletteColors[indexPath.item] == selectedColor {
            cell.layer.borderColor = UIColor.white.cgColor // Or another contrasting color
            cell.layer.borderWidth = 2.0
        } else {
            cell.layer.borderWidth = 0.0
        }
        cell.layer.cornerRadius = cell.frame.height / 2 // Make it circular

        return cell
    }
}

// MARK: - UICollectionViewDelegate
extension ViewController: UICollectionViewDelegate {
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        selectedColor = paletteColors[indexPath.item]
        print("Selected color: \(selectedColor.description)")

        // Reload collection view to update cell appearance (e.g., border for selection)
        collectionView.reloadData()
    }
}

// MARK: - UICollectionViewDelegateFlowLayout (Optional: For more control over layout)
// Storyboard already has itemSize. This is for more dynamic control if needed.
// extension ViewController: UICollectionViewDelegateFlowLayout {
//    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
//        let height = collectionView.bounds.height - 20 // Example: 10pt padding top/bottom
//        return CGSize(width: height, height: height) // Square cells
//    }
// }
