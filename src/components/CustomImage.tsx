import React, { useEffect, useState } from 'react';
import { Button, Image, Skeleton, Tooltip, Typography } from 'antd';
import { useInView } from 'react-intersection-observer';
import localforage from 'localforage';
import { DownloadOutlined, FileOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Img } from '../types/img';
import heic2any from 'heic2any';

const { Paragraph } = Typography;

const imageCache = localforage.createInstance({
  name: 'imageCache',
});

const getJpegOrPngImage = async (driveId: string, format: string) => {
  const cacheKey = `${driveId}_${format}`;
  try {
    const cachedImage = await imageCache.getItem<Blob>(cacheKey);
    if (cachedImage) {
      return URL.createObjectURL(cachedImage);
    }

    const res = await fetch(`https://lh3.googleusercontent.com/d/${driveId}=s220`);
    const blob = await res.blob();
    await imageCache.setItem(cacheKey, blob);
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error(`Error fetching ${format} image:`, err);
    return `https://lh3.googleusercontent.com/d/${driveId}=s220`;
  }
};

const getHeicImage = async (driveId: string) => {
  const cacheKey = `${driveId}_heic_converted`;
  try {
    const cachedImage = await imageCache.getItem<Blob>(cacheKey);
    if (cachedImage) {
      return URL.createObjectURL(cachedImage);
    }

    const res = await fetch(`https://lh3.googleusercontent.com/d/${driveId}=s220`);
    const heicBlob = await res.blob();
    const jpegBlob = (await heic2any({
      blob: heicBlob,
      toType: 'image/jpeg',
      quality: 0.8,
    })) as Blob;

    await imageCache.setItem(cacheKey, jpegBlob);
    return URL.createObjectURL(jpegBlob);
  } catch (err) {
    console.error('Error converting HEIC to JPEG:', err);
    return `https://lh3.googleusercontent.com/d/${driveId}=s220`;
  }
};

const getVideoThumbnail = async (driveId: string, format: string) => {
  const cacheKey = `${driveId}_${format}_thumbnail`;
  try {
    const cachedThumbnail = await imageCache.getItem<string>(cacheKey);
    if (cachedThumbnail) {
      return cachedThumbnail;
    }

    // Sử dụng thumbnail từ Google Drive
    const thumbnailUrl = `https://lh3.googleusercontent.com/d/${driveId}=s220`;
    await imageCache.setItem(cacheKey, thumbnailUrl);
    return thumbnailUrl;
  } catch (err) {
    console.error(`Error fetching video thumbnail:`, err);
    return `https://lh3.googleusercontent.com/d/${driveId}=s220`;
  }
};

const getImage = async (img: Img) => {
  switch (img.format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
    case 'png':
      return getJpegOrPngImage(img.driveId, img.format);
    case 'heic':
      return getHeicImage(img.driveId);
    case 'mov':
    case 'mp4':
      return getVideoThumbnail(img.driveId, img.format);
    default:
      return null;
  }
};

export const CustomImage: React.FC<{
  img: Img;
}> = ({ img }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  useEffect(() => {
    const handleImage = async () => {
      if (inView) {
        try {
          setLoading(true);
          const imgUrl = await getImage(img);
          setThumbnailUrl(imgUrl);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching image:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    handleImage();
  }, [inView, img]);

  const renderContent = () => {
    const imageFormats = ['jpeg', 'jpg', 'png', 'heic'];
    const videoFormats = ['mov', 'mp4'];

    if (loading) {
      return <Skeleton.Image active={true} />;
    }

    if (imageFormats.includes(img.format.toLowerCase())) {
      return (
        <Image
          src={thumbnailUrl as string}
          alt={img.name}
          className="rounded-lg w-full h-auto object-cover"
          preview={{
            src: `https://lh3.googleusercontent.com/d/${img.driveId}`,
          }}
          wrapperClassName="w-full h-auto"
          loading="lazy"
          placeholder={<div className="bg-gray-300 w-full h-auto animate-pulse" />}
        />
      );
    } else if (videoFormats.includes(img.format.toLowerCase())) {
      return (
        <video
          src={`https://drive.google.com/uc?export=download&id=${img.driveId}`}
          poster={thumbnailUrl as string}
          controls
          className="rounded-lg w-full h-auto object-cover"
        >
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return (
        <div className="flex justify-center items-center bg-gray-200 rounded-lg w-full h-auto">
          <FileOutlined style={{ fontSize: '48px', color: '#666' }} />
        </div>
      );
    }
  };

  const handleDownload = async () => {
    const response = await fetch(`https://drive.google.com/uc?export=download&id=${img.driveId}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = img.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleOpenInDrive = () => {
    window.open(`https://drive.google.com/file/d/${img.driveId}/view`, '_blank');
  };

  return (
    <div
      ref={ref}
      className={`w-full relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group`}
      style={{ transition: 'all 0.3s', opacity: loading ? 0.5 : 1 }}
    >
      {renderContent()}

      <div className="right-0 bottom-0 left-0 absolute bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 p-1 rounded-b-lg text-white transition-opacity">
        <Paragraph ellipsis={{ rows: 1 }} className="text-center text-sm text-white">
          {img.name}
        </Paragraph>
        <div className="flex justify-center space-x-2">
          <Tooltip title="Download">
            <Button icon={<DownloadOutlined />} onClick={handleDownload} size="small" className="border-0" />
          </Tooltip>
          <Tooltip title="Open in Drive">
            <Button icon={<FolderOpenOutlined />} onClick={handleOpenInDrive} size="small" className="border-0" />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
