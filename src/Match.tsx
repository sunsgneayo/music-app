import React, { useState ,useRef, useEffect } from 'react';
import {Box, Typography, List, ListItem ,ListItemButton ,ListItemIcon ,Avatar ,ListItemText} from '@mui/material';
import App from './App.tsx'


function Match() {
    const songList = [
        {
            artists: '趙雷',
            name: '我記得',
            avatar: 'https://spacexcode.oss-cn-hangzhou.aliyuncs.com/1697270523238-8b4b11a5-b5a3-4ac3-b6bd-1e264f526c76.png',
            link: '/我記得.mp3',
            lyric: '/命运的思量.lrc'
        },
        {
            artists: 'GS-大頭',
            name: '命运的思量',
            avatar: 'https://imge.kugou.com/stdmusic/20230719/20230719175858831314.jpg',
            link: '/命运的思量.mp3',
            lyric: '/命运的思量.lrc'
        },
        {
            artists: '趙雷',
            name: '程艾影',
            avatar: 'https://spacexcode.oss-cn-hangzhou.aliyuncs.com/1697270523238-8b4b11a5-b5a3-4ac3-b6bd-1e264f526c76.png',
            link: '/程艾影.mp3',
            lyric: '/命运的思量.lrc'
        },
    ];
    const [listShow, setListShow] = useState(false);
    const onMusicListShow = (state:boolean) =>{
        setListShow(state)
    }
    const [selectedSong, setSelectedSong] = useState(songList[1]);
    // 处理歌曲点击事件
    const handleSongClick = (song) => {
        setSelectedSong(song);
        // 在这里可以进行其他处理，比如播放选中的歌曲
    }
    return (
        <>
            <App onMusicListShow={onMusicListShow}  selectedSong={selectedSong} />

            <Box role="presentation" sx={{
                width: 'auto',
                display: !listShow ? 'none' : 'flex'  ,
                backgroundColor:'rgba(0,0,0,0.8)',
                color:'#fff',
                position: 'absolute',
                zIndex:10000
            }}>
                <List>
                    {songList.map((item, index) => (
                        <ListItem
                            key={index}
                            disablePadding
                        >
                            <ListItemButton onClick={() => handleSongClick(item)}>
                                <ListItemIcon>
                                    <Avatar alt={item.artists} src={item.avatar} />
                                </ListItemIcon>
                                <ListItemText secondary={
                                    <React.Fragment>
                                        <Typography sx={{ display: 'inline' }} component="span" variant="body1" color="text.primary">
                                            {item.name}
                                        </Typography>
                                        {' -- ' + item.artists}
                                    </React.Fragment>
                                } />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </>
    )
}

export default Match
