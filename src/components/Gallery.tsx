import React, { useEffect } from 'react';
import { CustomImage } from './CustomImage';
import { Img } from '../types/img';

interface File extends Img {
  _id: string;
  folderId: string;
  path: string;
}

interface GalleryProps {
  images: File[];
}

const Gallery: React.FC<GalleryProps> = ({ images }) => {
  const [cols, setCols] = React.useState(3);

  const columnIndices = Array.from({ length: cols }, (_, colIndex) =>
    Array.from({ length: Math.ceil(images.length / cols) }, (_, rowIndex) => rowIndex * cols + colIndex).filter(
      (index) => index < images.length
    )
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCols(1);
      } else if (window.innerWidth < 768) {
        setCols(2);
      } else if (window.innerWidth < 1024) {
        setCols(3);
      } else {
        setCols(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex md:flex-row flex-col md:gap-4">
      {columnIndices.map((column, colIndex) => (
        <div key={colIndex} className="flex flex-col flex-1 gap-4">
          {column.map((rowIndex) => (
            <CustomImage key={images[rowIndex]?._id ?? `${colIndex}-${rowIndex}`} img={images[rowIndex]} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Gallery;
