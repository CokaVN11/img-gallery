import React, { useEffect, useState } from 'react';
import { Button, Image, Tooltip, Typography } from 'antd';
import { useParams } from 'react-router-dom';
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
      return getJpegOrPngImage(img.id, img.format);
    case 'heic':
      return getHeicImage(img.id);
    case 'mov':
    case 'mp4':
      return getVideoThumbnail(img.id, img.format);
    default:
      return null;
  }
};

export const CustomImage: React.FC<{
  img: Img;
}> = ({ img }) => {
  const { id } = useParams<{ id: string }>();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  useEffect(() => {
    if (inView) {
      getImage(img).then(setThumbnailUrl);
    }
  }, [inView, img]);

  const renderContent = () => {
    const imageFormats = ['jpeg', 'jpg', 'png', 'heic'];
    const videoFormats = ['mov', 'mp4'];

    if (imageFormats.includes(img.format.toLowerCase())) {
      return (
        <Image
          src={thumbnailUrl as string}
          alt={img.name}
          className="rounded-t-lg object-contain"
          preview={{
            src: `https://lh3.googleusercontent.com/d/${img.id}`,
          }}
          loading="lazy"
          placeholder={<div className="bg-gray-300 w-full h-40 animate-pulse" />}
        />
      );
    } else if (videoFormats.includes(img.format.toLowerCase())) {
      return (
        <video
          src={`https://drive.google.com/uc?export=download&id=${img.id}`}
          poster={thumbnailUrl as string}
          controls
          className="rounded-t-lg w-full h-40 object-contain"
        >
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return (
        <div className="flex justify-center items-center bg-gray-200 rounded-t-lg w-full h-40">
          <FileOutlined style={{ fontSize: '48px', color: '#666' }} />
        </div>
      );
    }
  };

  const handleDownload = async () => {
    const response = await fetch(`https://drive.google.com/uc?export=download&id=${img.id}`);
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
    window.open(`https://drive.google.com/file/d/${img.id}/view`, '_blank');
  };

  return (
    <div
      ref={ref}
      className={`border rounded-lg min-w-[12rem] max-w-[12rem] h-full ${
        id === img.id ? 'border-red-500 bg-red-200' : 'border-gray-300'
      }`}
    >
      {renderContent()}

      <div className="bg-slate-200 m-2 px-4 py-1 rounded-md">
        <Paragraph ellipsis={{ rows: 2 }} className="mb-2 text-center">
          {img.name}
        </Paragraph>
        <div className="flex justify-center space-x-2">
          <Tooltip title="Download">
            <Button icon={<DownloadOutlined />} onClick={handleDownload} size="small" />
          </Tooltip>
          <Tooltip title="Open in Drive">
            <Button icon={<FolderOpenOutlined />} onClick={handleOpenInDrive} size="small" />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
