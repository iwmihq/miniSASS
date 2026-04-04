import React, { useState, useEffect } from "react";
import { Img } from "../../components/Img";
import { Fade } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css'
import { globalVariables } from "../../utils";
import Banner from "../Banner";

// Define an array of images for the slideshow TODO get the images list from the api
const slideshowImages = [
  `${globalVariables.staticPath}slideshow10.jpg`,
  `${globalVariables.staticPath}slideshow8.jpg`,
  `${globalVariables.staticPath}slideshow7.jpg`,
  `${globalVariables.staticPath}slideshow9.jpg`,
  `${globalVariables.staticPath}img_intrestedcitizensfromduct.png`,
];

const Slideshow: React.FC = () => {
  return (
    <div className="relative pb-10 sm:pb-14 bg-gradient-to-b from-transparent to-surface">
      <Banner />
      <div className="slide-container">
        <Fade>
          {slideshowImages.map((fadeImage, index) => (
            <div key={index}>
              <Img
                className="h-[200px] sm:h-[320px] md:h-[400px] lg:h-[464px] mx-auto w-full object-cover rounded-br-[65px]"
                src={fadeImage}
                alt="Slideshow"
              />
            </div>
          ))}
        </Fade>
      </div>
    </div>
  );
}


export default Slideshow;
