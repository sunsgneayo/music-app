import React, { useState ,useRef, useEffect } from 'react';
import './App.css'
import {Box, Typography, Slider, Stack} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import {
    FastRewindRounded,
    PauseRounded,
    FastForwardRounded,
    VolumeDownRounded,
    VolumeUpRounded,
    PlayArrowRounded
} from '@mui/icons-material';
import QueueMusicIcon from '@mui/icons-material/QueueMusic'


function App() {
    const audioElement = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.3);
    const [endTime, setEndTime] = useState(0);

    //歌詞處理
    // 解析 .lrc 歌词文本并将其转化为歌词对象
    const [lyrics, setLyrics] = useState([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
    const parseLrc = (lrcText) => {
        const lines = lrcText.split('\n');
        const parsedLyrics = [];

        for (const line of lines) {
            const match = line.match(/\[(\d+:\d+\.\d+)\](.+)/);
            if (match) {
                const timestamp = parseTimestamp(match[1]);
                const text = match[2];
                parsedLyrics.push({ timestamp, text });
            }
        }

        return parsedLyrics;
    }

    // 加载 .lrc 歌词文件并解析
    useEffect(() => {
        fetch('/命运的思量.lrc')
            .then(response => response.text())
            .then(text => {
                const parsedLyrics = parseLrc(text);
                setLyrics(parsedLyrics);
            });
    }, []);
    const handleMusicText = (currentTime) =>{
            for (let i = 0; i < lyrics.length; i++) {
                console.log(lyrics)
                if (i === lyrics.length - 1 || currentTime < lyrics[i + 1].timestamp ) {
                    setCurrentLyricIndex(i);
                    break;
                }
            }
    }

    const parseTimestamp = (timestamp) => {
        const [minutes, seconds] = timestamp.split(':').map(parseFloat);
        return minutes * 60 + seconds;
    }

    const handlePlayPause = () => {
        if (isPlaying) {
            audioElement.current.pause();
        } else {
            audioElement.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeChange = (event, newValue) => {
        audioElement.current.currentTime = newValue;
        setCurrentTime(newValue);
    };
    const handleVolumeChange = (event, newValue) => {
        audioElement.current.volume = newValue;
        setVolume(newValue);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }


    return (
        <>
            <Box sx={{width: '100%', overflow: 'hidden'}}>
                <div style={{
                    padding: 16,
                    borderRadius: 16,
                    width: 343,
                    maxWidth: '100%',
                    margin: 'auto',
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(40px)'
                }}>
                    <Box sx={{display: 'flex', alignItems: 'center', position: 'relative'}}>
                        <div style={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            overflow: 'hidden',
                            flexShrink: 0,
                            borderRadius: 8,
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            '& > img': {
                                width: '100%',
                            }
                        }}>
                            <img alt='命运的思量'
                                 src='https://spacexcode.oss-cn-hangzhou.aliyuncs.com/1697270523238-8b4b11a5-b5a3-4ac3-b6bd-1e264f526c76.png'/>
                        </div>
                        <Box sx={{position: 'absolute', top: 0, right: 0}}>
                            <IconButton aria-label="music queue">
                                <QueueMusicIcon fontSize="small" htmlColor='rgba(255,255,255,0.4)'/>
                            </IconButton>
                        </Box>
                        <Box sx={{ml: 1.5, minWidth: 0 ,color:'#fff'}}>
                            <Typography variant="caption"
                                        fontWeight={500}> GC 大頭 </Typography>
                            <Typography noWrap> <b>命運的思量</b> </Typography>
                            <Typography noWrap letterSpacing={-0.25}>
                                {lyrics.length > 0 ? lyrics[currentLyricIndex].text : '歌词未加载'}
                            </Typography>
                            {/*<Typography noWrap letterSpacing={-0.25}> 心很空 天很大 云很重 我很孤单 </Typography>*/}
                        </Box>
                    </Box>
                    <Slider
                        aria-label="time-indicator"
                        size="small"
                        value={currentTime}
                        // max={audioElement.current.duration || 0}
                        onChange={handleTimeChange}
                        min={0}
                        max={audioElement.current?.duration}
                        step={1}
                            sx={{
                                color: 'rgba(255,255,255,0.87)',
                                height: 4,
                                '& .MuiSlider-thumb': {
                                    width: 8,
                                    height: 8,
                                    transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                                    '&:before': {
                                        boxShadow: '0 2px 12px 0 rgba(255,255,255,0.4)',
                                    },
                                    '&:hover, &.Mui-focusVisible': {
                                        boxShadow: `0px 0px 0px 8px ${
                                            'rgb(255 255 255 / 16%)'
                                        }`,
                                    },
                                    '&.Mui-active': {
                                        width: 20,
                                        height: 20,
                                    },
                                },
                                '& .MuiSlider-rail': {
                                    opacity: 0.28,
                                },
                            }}
                    />
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -2}}
                    >
                        <div
                            style={{fontSize: '0.75rem', color:'#fff', opacity: 0.38, fontWeight: 500, letterSpacing: 0.2}}>
                            {formatTime(currentTime)}
                        </div>
                        <div
                            style={{fontSize: '0.75rem', color:'#fff', opacity: 0.38, fontWeight: 500, letterSpacing: 0.2}}>
                            {formatTime(endTime)}
                        </div>
                    </Box>
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', mt: -1}}
                    >
                        <audio
                            ref={audioElement}
                            src='/命运的思量.mp3'
                            onTimeUpdate={() => {
                                setCurrentTime(audioElement.current.currentTime)
                                setEndTime(audioElement.current.duration);
                                handleMusicText(audioElement.current.currentTime)
                            }}
                        />
                        <IconButton aria-label="previous song"   sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)', // 悬停时的颜色
                            },
                            '&:focus': {
                                outline:0
                            },
                        }}>
                            <FastRewindRounded fontSize="large" htmlColor='#fff'/>
                        </IconButton>
                        <IconButton aria-label='play-pause' onClick={handlePlayPause} sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)', // 悬停时的颜色
                            },
                            '&:focus': {
                                outline:0
                            },
                        }}>
                            {isPlaying ? (
                                <PauseRounded sx={{ fontSize: '3rem' }} htmlColor='#fff' />
                            ) : (
                                <PlayArrowRounded sx={{ fontSize: '3rem' }} htmlColor='#fff' />
                            )}
                        </IconButton>
                        <IconButton aria-label="next song" sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)', // 悬停时的颜色
                            },
                            '&:focus': {
                                outline:0
                            },
                        }}>
                            <FastForwardRounded fontSize="large" htmlColor='#fff'/>
                        </IconButton>
                    </Box>
                    <Stack spacing={2} direction="row" sx={{mb: 1, px: 1}} alignItems="center">
                        <VolumeDownRounded htmlColor='rgba(255,255,255,0.4)'/>
                        <Slider aria-label="Volume"
                                value={volume}
                                min={0}
                                step={0.01}
                                max={1}
                                onChange={handleVolumeChange}
                                sx={{
                                    color: 'rgba(255,255,255,0.87)',
                                    '& .MuiSlider-track': {
                                        border: 'none',
                                    },
                                    '& .MuiSlider-thumb': {
                                        width: 16,
                                        height: 16,
                                        backgroundColor: '#fff',
                                        '&:before': {
                                            boxShadow: '0 4px 8px rgba(255,255,255,0.4)',
                                        },
                                        '&:hover, &.Mui-focusVisible, &.Mui-active': {
                                            boxShadow: 'none',
                                        },
                                    },
                                }}
                        />
                        <VolumeUpRounded htmlColor='rgba(255,255,255,0.4)'/>
                    </Stack>
                </div>
            </Box>
        </>
    )
}

export default App