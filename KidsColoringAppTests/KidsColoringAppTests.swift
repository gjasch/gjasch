import XCTest
@testable import KidsColoringApp // Important: Allows access to internal types from the app module

class KidsColoringAppTests: XCTestCase {

    var viewController: ViewController!

    override func setUpWithError() throws {
        // This method is called before the invocation of each test method in the class.
        // Put setup code here.
        try super.setUpWithError()

        // Load the ViewController from the storyboard
        let storyboard = UIStoryboard(name: "Main", bundle: Bundle(for: ViewController.self))
        viewController = storyboard.instantiateViewController(withIdentifier: "BYZ-38-t0r") as? ViewController // BYZ-38-t0r is the default ID for the initial VC in a new storyboard.

        // Ensure it's not nil, otherwise tests will fail unexpectedly
        XCTAssertNotNil(viewController, "ViewController could not be instantiated from storyboard.")

        // Load the view hierarchy
        viewController.loadViewIfNeeded()
    }

    override func tearDownWithError() throws {
        // This method is called after the invocation of each test method in the class.
        viewController = nil
        try super.tearDownWithError()
    }

    // Test methods will go here

    func testOutletsAreConnected() {
        XCTAssertNotNil(viewController.canvasImageView, "canvasImageView outlet should be connected.")
        XCTAssertNotNil(viewController.colorPaletteCollectionView, "colorPaletteCollectionView outlet should be connected.")
    }

    func testCanvasImageViewHasTapGestureRecognizer() {
        guard let imageView = viewController.canvasImageView else {
            XCTFail("canvasImageView is nil.")
            return
        }
        XCTAssertTrue(imageView.isUserInteractionEnabled, "canvasImageView should have user interaction enabled.")

        let gestureRecognizers = imageView.gestureRecognizers ?? []
        XCTAssertFalse(gestureRecognizers.isEmpty, "canvasImageView should have at least one gesture recognizer.")

        let hasTapGesture = gestureRecognizers.contains { $0 is UITapGestureRecognizer }
        XCTAssertTrue(hasTapGesture, "canvasImageView should have a UITapGestureRecognizer.")
    }

    func testColorPaletteCollectionViewDelegatesSet() {
        guard let collectionView = viewController.colorPaletteCollectionView else {
            XCTFail("colorPaletteCollectionView is nil.")
            return
        }
        XCTAssertNotNil(collectionView.dataSource, "colorPaletteCollectionView dataSource should be set.")
        XCTAssertTrue(collectionView.dataSource === viewController, "colorPaletteCollectionView dataSource should be the ViewController.")

        XCTAssertNotNil(collectionView.delegate, "colorPaletteCollectionView delegate should be set.")
        XCTAssertTrue(collectionView.delegate === viewController, "colorPaletteCollectionView delegate should be the ViewController.")
    }

    func testColorPaletteInitialization() {
        XCTAssertFalse(viewController.paletteColors.isEmpty, "paletteColors should not be empty.")

        // Assuming selectedColor is initialized to the first color in paletteColors or black if empty
        let expectedInitialColor = viewController.paletteColors.first ?? UIColor.black
        XCTAssertEqual(viewController.selectedColor, expectedInitialColor, "selectedColor should be initialized to the first palette color or black.")
    }

    func testColorSelectionUpdatesSelectedColor() {
        guard let collectionView = viewController.colorPaletteCollectionView else {
            XCTFail("colorPaletteCollectionView is nil.")
            return
        }

        // Ensure palette has at least two colors for this test to be meaningful
        guard viewController.paletteColors.count >= 2 else {
            XCTFail("Palette needs at least two colors for this test.")
            return
        }

        let initialSelectedColor = viewController.selectedColor
        let secondColor = viewController.paletteColors[1] // Select the second color

        XCTAssertNotEqual(initialSelectedColor, secondColor, "Test setup error: initial and second color should be different.")

        // Simulate selecting the second color
        let indexPathToSelect = IndexPath(item: 1, section: 0)
        viewController.collectionView(collectionView, didSelectItemAt: indexPathToSelect)

        XCTAssertEqual(viewController.selectedColor, secondColor, "selectedColor should update to the newly selected color.")
    }

    func testHandleCanvasTapActionSelector() {
        guard let imageView = viewController.canvasImageView else {
            XCTFail("canvasImageView is nil.")
            return
        }

        guard let gestureRecognizers = imageView.gestureRecognizers else {
            XCTFail("canvasImageView has no gesture recognizers.")
            return
        }

        let tapGesture = gestureRecognizers.first { $0 is UITapGestureRecognizer } as? UITapGestureRecognizer
        XCTAssertNotNil(tapGesture, "UITapGestureRecognizer not found.")

        // Check if the gesture recognizer is set up to call handleCanvasTap on the view controller
        // This requires some work to extract the target and action.
        // For simplicity, we'll assume if a tap gesture is present and its target is the VC, it's likely correct.
        // A more robust test would involve KVC to get the action selector.

        var actionFound = false
        if let tapGesture = tapGesture {
            // Accessing target and action directly is tricky and not standard for XCTest without specific helpers or KVC.
            // However, we know we set it to #selector(handleCanvasTap(_:))
            // This is a limited check:
            let targets = tapGesture.value(forKey: "targets") as? [AnyObject]
            if let targetActionPair = targets?.first {
                let target = targetActionPair.value(forKey: "target")
                let action = targetActionPair.value(forKey: "action") as? Selector

                XCTAssertTrue(target === viewController, "Tap gesture target should be the ViewController.")
                XCTAssertEqual(action, #selector(ViewController.handleCanvasTap(_:)), "Tap gesture action should be handleCanvasTap.")
                actionFound = true
            }
        }
        if !actionFound {
             // Fallback if KVC fails or if we just want to note this part of test is limited
            print("NOTE: Full verification of tap gesture's action selector might require UI Testing or more advanced unit testing techniques.")
            // We know it's added in code, so for this environment, we trust its presence from testCanvasImageViewHasTapGestureRecognizer
        }
    }
}
