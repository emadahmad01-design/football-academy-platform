-- Increase training video URL length to support long CDN links
ALTER TABLE `training_videos`
  MODIFY COLUMN `videoUrl` varchar(2000) NOT NULL;
