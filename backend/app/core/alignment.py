import cv2
import numpy as np

def align_pcb_image(input_bgr: np.ndarray, master_ref_bgr: np.ndarray = None) -> np.ndarray:
    """
    Sub-10ms OpenCV ORB feature alignment & Homography transformation.
    Aligns rotated/shifted PCB board frames against a standard master template.
    """
    if master_ref_bgr is None or input_bgr is None:
        return input_bgr

    try:
        # Convert images to grayscale
        gray_input = cv2.cvtColor(input_bgr, cv2.COLOR_BGR2GRAY)
        gray_ref = cv2.cvtColor(master_ref_bgr, cv2.COLOR_BGR2GRAY)

        # Initialize ORB detector
        orb = cv2.ORB_create(nfeatures=500)

        # Detect keypoints and descriptors
        kp1, des1 = orb.detectAndCompute(gray_input, None)
        kp2, des2 = orb.detectAndCompute(gray_ref, None)

        if des1 is None or des2 is None or len(des1) < 4 or len(des2) < 4:
            return input_bgr

        # Match descriptors using BFMatcher
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)

        # Sort matches by distance
        matches = sorted(matches, key=lambda x: x.distance)

        # Keep top 15% good matches
        good_matches = matches[:max(10, int(len(matches) * 0.15))]

        if len(good_matches) < 4:
            return input_bgr

        # Extract location of good matches
        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        # Find Homography matrix
        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

        if H is None:
            return input_bgr

        # Warp perspective to align
        h, w = master_ref_bgr.shape[:2]
        aligned_img = cv2.warpPerspective(input_bgr, H, (w, h))
        return aligned_img

    except Exception:
        # Fallback to unaligned frame on error to maintain pipeline throughput
        return input_bgr
