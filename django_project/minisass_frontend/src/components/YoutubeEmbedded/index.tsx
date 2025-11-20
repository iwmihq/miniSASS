import React from 'react';

interface YouTubeVideoProps {
  videoId: string; // YouTube video ID
  height?: string; // Height of the iframe
  width?: string; // Width of the iframe
  playButtonColor?: 'red' | 'green' | 'transparent'; // Custom play button color
}

const YouTubeVideo: React.FC<YouTubeVideoProps> = ({ videoId, height, width }) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
  console.log(embedUrl);

  return (
      <div className='video-responsive'>
          <iframe
              width={width}
              height={height}
              src={embedUrl}
              title="miniSASS"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{borderRadius: '25px 0px 25px 25px'}}
              allowFullScreen></iframe>
      </div>
  );
};

export default YouTubeVideo;
