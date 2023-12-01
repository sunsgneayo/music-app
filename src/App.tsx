// tslint:disable
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


function App({ selectedSong, onMusicListShow ,musicListShow  ,onNextMusic}) {
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

    const  onLoadLyrics = (lyric) => {
        fetch(lyric)
            .then(response => response.text())
            .then(text => {
                const parsedLyrics = parseLrc(text);
                setLyrics(parsedLyrics);
            })
    }

    // 加载 .lrc 歌词文件并解析
    useEffect(() => {
        console.log('加载歌词')
        console.log(selectedSong.lyric)
        fetch(selectedSong.lyric)
            .then(response => response.text())
            .then(text => {
                const parsedLyrics = parseLrc(text);
                setLyrics(parsedLyrics);
            });
    }, []);
    const handleMusicText = (currentTime) =>{
            for (let i = 0; i < lyrics.length; i++) {
                if (i === lyrics.length - 1 || (currentTime + 0.3) < lyrics[i + 1].timestamp ) {
                    setCurrentLyricIndex(i);
                    break;
                }
            }
            if (currentTime === audioElement.current.duration){
                onNextMusic()
            }
    }

    const parseTimestamp = (timestamp) => {
        const [minutes, seconds] = timestamp.split(':').map(parseFloat);
        return minutes * 60 + seconds;
    }

    // 處理播放按鈕的事件
    const handlePlayPause = () => {
        if (isPlaying) {
            audioElement.current.pause();
        } else {
            audioElement.current.play();
        }
        //设置播放结束时间
        setEndTime(audioElement.current.duration);
        setIsPlaying(!isPlaying);
        audioElement.current.volume = volume
    };

    // 处理播放时间进度条
    const handleTimeChange = (event, newValue) => {
        audioElement.current.currentTime = newValue;
        setCurrentTime(newValue);
    };
    // 处理音量变化
    const handleVolumeChange = (event, newValue) => {
        audioElement.current.volume = newValue;
        setVolume(newValue);
    };

    // 时间格式化
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }


    const [listShow, setListShow] = useState(false);
    // 子组件控制父组件弹出层
    const handleMusicListShow = () => {
        onMusicListShow(!listShow)
        setListShow(!listShow)
    }


    // 父组件切歌监听
    const initialRender = useRef(true);
    // 使用 selectedSong 进行操作
    useEffect(() => {
        // 检查是否是初始渲染
        if (initialRender.current) {
            initialRender.current = false; // 标记初始渲染为 false
        } else {
            // 当 selectedSong 变化时，执行相应的操作，例如播放选中的歌曲
            console.log(`选择了歌曲：${selectedSong.name} - ${selectedSong.artists}`);

            onLoadLyrics(selectedSong.lyric)
            // 在这里可以执行播放等操作
            if (selectedSong.play === true){
                audioElement.current.play()
                setIsPlaying(true)
            }

        }
    }, [selectedSong]);

    // 监听父组件抽屉响应事件
    useEffect(() => {
        setListShow(musicListShow)
    }, [musicListShow]);

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
                            <img alt={selectedSong.name}
                                 src={selectedSong.avatar}/>
                        </div>
                        <Box sx={{position: 'absolute', top: 0, right: 0}}>
                            <IconButton aria-label="music queue" onClick={handleMusicListShow} sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)', // 悬停时的颜色
                                },
                                '&:focus': {
                                    outline:0
                                },
                            }}>
                                <QueueMusicIcon fontSize="small" htmlColor='rgba(255,255,255,0.4)'/>
                            </IconButton>
                        </Box>
                        <Box sx={{ minWidth: 0 ,color:'#fff' , width:1}}>
                            <Typography variant="caption" fontWeight={500}> {selectedSong.artists} </Typography>
                            <Typography noWrap> <b>{selectedSong.name}</b> </Typography>
                            <Typography noWrap letterSpacing={-0.25}>
                                {lyrics.length > 0 ? lyrics[currentLyricIndex].text : '歌词未加载'}
                            </Typography>
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
                            src={selectedSong.link}
                            onTimeUpdate={() => {
                                // 更新已播放時間
                                setCurrentTime(audioElement.current.currentTime)
                                handleMusicText(audioElement.current.currentTime)
                            }}
                        />
                        <IconButton onClick={onNextMusic} aria-label="previous song"   sx={{
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
                        <IconButton onClick={onNextMusic}  aria-label="next song" sx={{
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
