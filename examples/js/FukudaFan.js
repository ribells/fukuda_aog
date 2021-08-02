// 
// Sample code for "Fukuda-Style Image Tiling" by Bengt-Olaf Schneider.
// Copyright Bruce Campbell and Bengt-Olaf Schneider, 2021

// This file provides a sample implementation for creating a Fukuda-style rendering using a fan pattern.
//
// Notes:
//
// This code uses P5.js, see www.p5js.org.
//
// For clarity, various parameters are hardcoded, including
// - image name and image dimensions
// - the fan location, centered at the center of the image's bottom edge.
// - minimum and maximum percentage of the strip's width that can be filled
// 
// Compared to Figures 2+3 in the published paper this code uses a simplified traversal for computing the modulated width of a strip.
// Instead of collecting all the pixel values within the strip on a line perpendicular to the strip's centerline,
// it simply computes the average of a nine-pixel neighborhood around the current anchor point.
// The results of this procedure closely resemble the images created by the more sophisticated procedure described in the paper.
//
// Simple animation effects can be enabled by global variables "evolve", "breathe" or "unfurl".
//

// -----------------------------------------------------------------------------------------------------------------
// Hardcoded, global parameters
let    img;
let    num_strips  = 50;
let    img_w       = 515;
let    img_h       = 768;
let    angle_start = -90;
let    angle_end   = 90;
let    step_size   = 1.0;
let    pct_min     = 10;
let    pct_max     = 100;
let    solid_color = true;
let    evolve      = false;		// animation varying strip-width, creating effect of an evolving image, see Figure 6
let    breathe     = false;		// animation varying modulation, creating effecting of "breathing" image, see Figure 7
let    unfurl      = false;		// animation varying fan's end angle, creating effect of "unfurling" image, see Figure 8
let    bimage      = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/515px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg"

// -----------------------------------------------------------------------------------------------------------------
// Utility functions
function deg2rad (d)
{
	// Convert from degrees (0...360) to radian (0...2PI)
    return d/180 * Math.PI;
}


function get_intensity (idx, xoff, yoff)
{
    // Compute intensity of pixel at (xoff, yoff) relative to pixel starting at index.
  
    // Adjust idx by offset - each pixel as 4 bytes (RGB), each scanline has therefore 4*img_w bytes
    idx_off = idx + yoff*4*img_w + 4*xoff;
  
    // Simplistic intensity calculation as R+B+G, range = [0 .. 3*255]
    return mona[idx_off] + mona[idx_off+1] + mona[idx_off+2];  
}

function get_stripwidth (x,y, u,v)
{
    // Compute the distance between points P (e.g. fan origin) and Q (e.g anchor).
    D = Math.sqrt( (x-u)*(x-u) + (y-v)*(y-v) );

    // Compute the strip width (W) at the given distance (D) from the fan's origin (O).
    // The strip encloses an angle of angle_inc (A).
    //
    //    W/2   -----
    //              -----
    //                   -----       
    //                        -----
    //         ---+------------------A---+ 
    //            D           -----      O
    //                   -----
    //              -----
    //    W/2  -----
    //
    // tan(A/2) = W/2 / D  ==> W = 2D tan(A/2)
  
    return 2*D * Math.tan(angle_inc/2);
}

function FukudaFan() {
	// Define global parameters used by draw() function
	num_strips_change= +1;
    pct_change = +5;
	angle_change = +5;
    
    img_w = img.width;
    img_h = img.height;
    image(img, 0, 0, img_w, img_h);
    img.loadPixels();
    mona = img.pixels;

    origin = [img_w/2, img_h-1];  // Center the fan in the middle of the image's bottom edge
    
    stroke(20, 120, 210, 255);    // draw blue-ish strips
    strokeWeight(2);              // strips are drawin with 2 pixels lines
}

function draw_fukuda() {  
    // Clear the entire canvas before drawing the fan strips
    fill(255, 255, 220);
    rect(0, 0, img_w, img_h);

    // Iterate through all strips in the fan
    start_angle = deg2rad(angle_start);
    end_angle   = deg2rad(angle_end);
	angle_inc   = (end_angle - start_angle) / num_strips;
    for(angle=start_angle; angle<=end_angle; angle+=angle_inc) {
        // Compute the "direction" of the current strip's centerline
        // and the "spread", i.e. a vector perpendicular to the centerline
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        if ((-Math.PI/2 <= angle) && (angle < -Math.PI/4)) {
            direction = [-c,+s];
            spread    = [+s,+c];
        } else if ((-Math.PI/4 <= angle) && (angle < 0)) {
            direction = [-c,+s];
            spread    = [-s,-c];
        } else if ((0 <= angle) && (angle < Math.PI/4)) {
            direction = [+c,-s];
            spread    = [-s,-c];
        } else if ((Math.PI/4 <= angle) && (angle < Math.PI/2)) {
            direction = [+c,-s];
            spread    = [-s,-c];    
        }
      
        length = [0,0,0,0,0];  // array to hold the length of the last 5 steps to compute a running average length
        avg_length = 0;

        // Step through the image starting at the fan's origin.
		// (This assumes that the origin is on some edge of the image.!)
		// Stop once the strip extends beyond the image bounds.
        x = origin[0];
        y = origin[1]; 
		done = false;
	    while (!done) {
			if ( ! (x>=0 && x<img_w && y>=0 && y<img_h))
				done = true;
			else {
				index = 4 * (Math.floor(y-1)*img_w + Math.floor(x));  // index into the linear array of image pixels, each pixel has 4 bytes (RGBA)
			  
				// sample nine points centered by anchor point
				//   0 1 2
				//   3 4 5
				//   6 7 8
				intensity = 0;
				intensity += get_intensity(index, -1,-1);  // 0
				intensity += get_intensity(index,  0,-1);  // 1
				intensity += get_intensity(index, +1,-1);  // 2
				intensity += get_intensity(index, -1, 0);  // 3
				intensity += get_intensity(index,  0, 0);  // 4 (anchor)
				intensity += get_intensity(index, +1, 0);  // 5
				intensity += get_intensity(index, -1,+1);  // 6
				intensity += get_intensity(index,  0,+1);  // 7
				intensity += get_intensity(index, +1,+1);  // 8

				//smooth with moving_average
				length[0] = length[1];
				length[1] = length[2];
				length[2] = length[3];
				length[3] = length[4];
				length[4] = intensity/9/785;  // divide by size of neighborhood (9) and maximum intensity per pixel (3x255)

				// Use intensity as a measure for the strip width, clamp to min/max strip width
				if(length[4]>pct_max/100) length[4]=pct_max/100;
				if(length[4]<pct_min/100) length[4]=pct_min/100;

				avg_length = (length[0]+length[1]+length[2]+length[3]+length[4])/5;
			}
		  
			if(!solid_color) stroke(mona[index],mona[index+1],mona[index+2]);  // optionally, use anchor's original color for this point of the strip
		  
			// Fill the strip, its width modulated by avg_length.
			stripwidth = get_stripwidth(x,y, origin[0],origin[1]);
			w = stripwidth/2 * avg_length;  // actual width of the strip as percentage of maximum width
			line (x - spread[0] * w, y - spread[1] * w,
				  x + spread[0] * w, y + spread[1] * w);
				  
            // Done with this step, advance anchor
            x += direction[0]*step_size;
            y += direction[1]*step_size;
		}
    }
}

// -----------------------------------------------------------------------------------------------------------------
// P5 global entry points

function preload() {
    img = loadImage(bimage);
}

function setup() {
    const canvas = createCanvas(img_w, img_h)
    FukudaFan();
}

function draw() {
	
	if (evolve) {
        if (num_strips > 50) num_strips_change = -1;
	    if (num_strips <  5) num_strips_change = +1;
	    num_strips += num_strips_change;
	}
	
	if (breathe) {
		if (pct_max > 90)      pct_change = -5;
		if (pct_max < pct_min) pct_change = +5;
		pct_max += pct_change;
	}
	
	if (unfurl) {
		if (angle_end >  90) angle_change = -5;
		if (angle_end < -80) angle_change = +5;
		angle_end += angle_change;
	}
	
	draw_fukuda();
}

function mousePressed() {
}

function keyPressed() {
    if (keyCode === ENTER) {}
}
