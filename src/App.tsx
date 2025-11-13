// tslint:disable
import { useState ,useRef, useEffect } from 'react';
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


function App({ selectedSong, onMusicListShow ,musicListShow  ,onNextMusic}: any) {
    const audioElement = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.3);
    const [endTime, setEndTime] = useState(0);
    
    // Web Audio API 相关
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    //歌詞處理
    // 解析 .lrc 歌词文本并将其转化为歌词对象
    const [lyrics, setLyrics] = useState<Array<{timestamp: number, text: string}>>([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(0);

    // 背景图片处理
    const parseLrc = (lrcText: string) => {
        const lines = lrcText.split('\n');
        const parsedLyrics: Array<{timestamp: number, text: string}> = [];

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

    const  onLoadLyrics = (lyric: string) => {
        fetch(lyric)
            .then(response => response.text())
            .then(text => {
                const parsedLyrics = parseLrc(text);
                setLyrics(parsedLyrics);
            })
    }

    // 加载 .lrc 歌词文件并解析
    useEffect(() => {
        // 加载歌词
        if (selectedSong?.lyric) {
            fetch(selectedSong.lyric)
                .then(response => response.text())
                .then(text => {
                    const parsedLyrics = parseLrc(text);
                    setLyrics(parsedLyrics);
                });
        }
        // 读取音频时长
        if (audioElement.current) {
            audioElement.current.addEventListener('loadedmetadata', () => {
                if (audioElement.current && !isNaN(audioElement.current.duration)) {
                    setEndTime(audioElement.current.duration);
                }
            });
        }
    }, []);
    const handleMusicText = (currentTime: number) =>{
        if (!audioElement.current) return;
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

    const parseTimestamp = (timestamp: string) => {
        const [minutes, seconds] = timestamp.split(':').map(parseFloat);
        return minutes * 60 + seconds;
    }

    // 初始化 Web Audio API
    const initAudioContext = () => {
        // 如果已经初始化过，只需要确保绘制循环在运行
        if (audioContextRef.current && analyserRef.current && sourceRef.current) {
            // 如果绘制循环没有运行，重新启动
            if (animationFrameRef.current === null) {
                draw();
            }
            return;
        }

        if (!audioElement.current || !canvasRef.current) {
            return;
        }

        // 检查浏览器兼容性
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
            console.error('您的浏览器不支持 Web Audio API');
            return;
        }

        // 创建 AudioContext
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContextClass();
        }

        // 检查 audio 元素是否已经被连接过
        // 如果 sourceRef 不存在，尝试创建（但可能会失败如果已经连接过）
        if (!sourceRef.current) {
            try {
                // 创建音频源节点（一个 audio 元素只能创建一次）
                sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement.current);
            } catch (error) {
                // 如果已经连接过，尝试从 audio 元素获取现有的 source
                // 但这是不可能的，所以我们只能跳过可视化
                console.warn('Audio element already connected, skipping visualization setup');
                return;
            }
        }

        // 创建 AnalyserNode
        if (!analyserRef.current) {
            analyserRef.current = audioContextRef.current.createAnalyser();
            
            // AnalyserNode 设置
            analyserRef.current.fftSize = 256; // 较小的 fftSize 可以得到更粗的条形
            analyserRef.current.smoothingTimeConstant = 0.7; // 使条形图的跳动更平滑
        }

        // 连接节点: source -> analyser -> destination
        if (sourceRef.current && analyserRef.current && audioContextRef.current) {
            try {
                // 尝试连接 source -> analyser（如果还没有连接）
                // 使用 try-catch 来处理已经连接的情况
                try {
                    sourceRef.current.connect(analyserRef.current);
                } catch (e: any) {
                    // InvalidStateError 表示已经连接，这是正常的，可以忽略
                    if (e.name !== 'InvalidStateError') {
                        // 其他错误才记录
                        console.warn('Source connection warning:', e);
                    }
                }
                
                // 确保 analyser 连接到 destination
                // 先断开 analyser 的所有连接（如果存在），然后重新连接
                try {
                    analyserRef.current.disconnect();
                } catch (e) {
                    // 如果未连接，忽略错误
                }
                analyserRef.current.connect(audioContextRef.current.destination);
            } catch (error) {
                // 如果连接失败，记录警告但继续
                console.warn('Failed to connect audio nodes:', error);
            }
        }

        // 开始绘制循环
        draw();
    }

    // 绘制频谱条形图
    const draw = () => {
        if (!analyserRef.current || !canvasRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        const analyser = analyserRef.current;

        if (!canvasCtx) {
            return;
        }

        // 请求下一帧动画
        animationFrameRef.current = requestAnimationFrame(draw);

        // 获取频率域数据
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // 清空画布（使用透明背景，让父容器的背景色显示）
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // 计算每个条的宽度和间距
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        // 遍历数据并绘制每个条形
        for(let i = 0; i < bufferLength; i++) {
            // 限制条形高度，使其不超过画布高度的80%
            let barHeight = (dataArray[i] / 255) * (canvas.height * 0.8);

            // 根据强度设置透明度，使用白色/灰色调，符合整体UI风格
            // 强度越高，透明度越高（更亮）
            const opacity = 0.3 + (dataArray[i] / 255) * 0.5; // 0.3 到 0.8 的透明度范围
            canvasCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

            // 绘制矩形条
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            // 移动到下一个条的位置
            x += barWidth + 1;
        }
    }

    // 完全清理函数（仅在组件卸载时使用）
    const fullCleanup = () => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (sourceRef.current) {
            try {
                sourceRef.current.disconnect();
            } catch (e) {
                // 忽略断开连接错误
            }
            sourceRef.current = null;
        }
        if (analyserRef.current) {
            try {
                analyserRef.current.disconnect();
            } catch (e) {
                // 忽略断开连接错误
            }
            analyserRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
    }

    // 處理播放按鈕的事件
    const handlePlayPause = () => {
        if (!audioElement.current) return;
        if (isPlaying) {
            audioElement.current.pause();
            setBodyBackground(''); // 暂停时清除背景
        } else {
            audioElement.current.play();
            setBodyBackground(selectedSong.avatar); // 播放时设置背景
            // 初始化 Web Audio API（在用户交互后）
            initAudioContext();
        }
        //设置播放结束时间
        if (!isNaN(audioElement.current.duration)) {
            setEndTime(audioElement.current.duration);
        }
        setIsPlaying(!isPlaying);
        audioElement.current.volume = volume
    };


    // 设置 body 背景的函数
    const setBodyBackground = (imageUrl: string) => {
        const body = document.body;
        if (imageUrl) {
            body.style.backgroundImage = `url(${imageUrl})`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            body.style.backgroundAttachment = 'fixed';
        } else {
            body.style.backgroundImage = 'none';
        }
    };

    // 处理播放时间进度条
    const handleTimeChange = (_event: Event, newValue: number | number[]) => {
        if (!audioElement.current) return;
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        audioElement.current.currentTime = value;
        setCurrentTime(value);
    };
    // 处理音量变化
    const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
        if (!audioElement.current) return;
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        audioElement.current.volume = value;
        setVolume(value);
    };

    // 时间格式化
    const formatTime = (seconds: number) => {
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
            if (selectedSong.play === true && audioElement.current){
                // 停止绘制循环（切换歌曲时）
                if (animationFrameRef.current !== null) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                
                audioElement.current.play()
                setIsPlaying(true)
                console.log('切换播放背景' ,selectedSong.avatar)
                setBodyBackground(selectedSong.avatar); // 播放时设置背景
                // 初始化 Web Audio API（会复用已存在的 source）
                initAudioContext();
            }


        }
    }, [selectedSong]);

    // 组件卸载时清理资源
    useEffect(() => {
        return () => {
            fullCleanup();
        };
    }, []);

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
                            backgroundColor: 'rgba(255,255,255,0.08)'
                        }}>
                            <img alt={selectedSong.name}
                                 src={selectedSong.avatar}
                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
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
                    {/* 音频频谱可视化 */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <canvas 
                            ref={canvasRef}
                            width={343}
                            height={50}
                            style={{
                                width: '100%',
                                maxWidth: '343px',
                                height: '50px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(0,0,0,0.2)'
                            }}
                        />
                    </Box>
                    <Slider
                        aria-label="time-indicator"
                        size="small"
                        value={currentTime}
                        // max={audioElement.current.duration || 0}
                        onChange={handleTimeChange}
                        min={0}
                        max={endTime}
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
                            crossOrigin="anonymous"
                            onTimeUpdate={() => {
                                // 更新已播放時間
                                if (audioElement.current) {
                                    setCurrentTime(audioElement.current.currentTime)
                                    handleMusicText(audioElement.current.currentTime)
                                }
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
