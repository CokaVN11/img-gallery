import React from 'react';
import { CustomImage } from './CustomImage';
import { Img } from '../types/img';

interface GalleryProps {
  images: Img[];
}

const Gallery: React.FC<GalleryProps> = ({ images }) => {
  return (
    <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-4">
      {images.map((img) => (
        <CustomImage key={img.id} img={img} />
      ))}
    </div>
  );
};

export default Gallery;
