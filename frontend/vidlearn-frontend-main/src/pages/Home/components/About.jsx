import React from "react";
import AboutText from "./AboutText";
import HowItWorks from "./HowItWorks";
import Gallery from "./Gallery";

function About() {
  return (
    <div className="container">
      <div className="about">
        <AboutText />
        <HowItWorks />
        <Gallery />
      </div>
    </div>
  );
}

export default About;
