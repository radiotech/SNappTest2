import React, {CSSProperties, useState, useEffect, Fragment} from 'react';
import {RouteComponentProps, navigate} from "@reach/router";
import Frame from '../components/Frame';
import svg from '../images/upload.svg';
import MusicXML, {ScoreTimewise} from 'musicxml-interfaces';
import {useCurrentFileState} from '../contexts/CurrentFile';
import {useDialogState} from '../contexts/Dialog';
import * as Dialog from '../util/Dialog';
import JSZip from 'jszip';

type Props = {} & RouteComponentProps;

const Menu: React.FC<Props> = () => {
    type recentFile = {
        file_name: string,
        date: number,
        id: string,
    };

    let [recentFiles, setRecentFiles] = useState<recentFile[]>(undefined!);

    let [, setDialogState] = useDialogState();
    let [, setCurrentFile] = useCurrentFileState();

    let showError = (error: string)=>{
        setDialogState(Dialog.showMessage('An Error Occurred',error,'Close',()=>{
            setDialogState(Dialog.close());
        }));
    }

    useEffect(() => {
        let recent: recentFile[] = null!;
        try {
            recent = JSON.parse(localStorage.getItem('recent_files')!);
        } catch (e) {}
        if (recent === null) {
            recent = [];
        }
        setRecentFiles(recent);
    }, []);

    const loadFile = (x: recentFile) => {
        try {
            let parsed = JSON.parse(localStorage.getItem(x.id)!);

            // Set this song as the current work in the global context
            setCurrentFile({type: 'set', val: {id: x.id, file_name: x.file_name, data: parsed}});

            try {
                // Set this song as the current work in localStorage
                localStorage.setItem('current_file', x.id);
            } catch(e){
                // Local storage may be disabled
                console.error(e);
            }

            navigate('convert');
        } catch (e) {
            showError('An issue was encountered while loading the data for this file.');
            console.error(e);
        }
    };
    
    const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        let fileName = (e.target as any).files[0].name.replace(/\.(?:musicxml|mxl)$/i, '');
        let failedReads = 0;
        let fail = ()=>{
            failedReads++;
            if(failedReads === 2){ //both reads failed
                showError('An issue was encountered while reading the selected file.');
            }
        }
        try {
            let reader1 = new FileReader();
            reader1.onload = function () {
                try {
                    let data = reader1.result;
                    if(data === null){
                        throw new Error('Failed to read file - null');
                    }
                    //try to interpret this file as compressed
                    
                    (async ()=>{
                        try {
                            let zip = await JSZip.loadAsync(data);
                            let details = await zip.file('META-INF/container.xml').async("text");
                            let parser = new DOMParser();
                            let detailsDOM = parser.parseFromString(details, "application/xml");
                            let nodes = detailsDOM.getElementsByTagName('rootfile');
                            let musicXMLPath = nodes[0].getAttribute('full-path')!;
                            for(let i = nodes.length-1; i >= 0; i--){
                                if(nodes[i].getAttribute('media-type') === 'application/vnd.recordare.musicxml+xml'){
                                    musicXMLPath = nodes[i].getAttribute('full-path')!;
                                }
                            }
                            let musicXMLData = await zip.file(musicXMLPath).async("text");
                            let parsed = MusicXML.parseScore(musicXMLData);
                            if(parsed.measures === undefined){
                                throw new Error('Invalid MusicXML format');
                            }
                            onUpload(fileName,parsed);
                        } catch(e){
                            fail();
                            console.error(e);
                        }
                    })();
                } catch (e) {
                    fail();
                    console.error(e);
                }
            };
            reader1.readAsArrayBuffer((e.target as any).files[0]);
            let reader2 = new FileReader();
            reader2.onload = function () {
                try {
                    let data = reader2.result;
                    if(data === null){
                        throw new Error('Failed to read file - null');
                    }
                    //try to interpret this file as uncompressed
                    let parsed = MusicXML.parseScore(data as string);
                    
                    if(parsed.measures === undefined){
                        throw new Error('Invalid MusicXML format');
                    }
                    console.log(parsed);
                    
                    onUpload(fileName,parsed);
                } catch (e) {
                    fail();
                    console.error(e);
                }
            };
            reader2.readAsText((e.target as any).files[0]);





            // let reader = new FileReader();
            // reader.onload = function () {
            //     try {
            //         let data = reader.result;
            //         let parsed: ScoreTimewise;
            //         if(data === null){
            //             throw new Error('Failed to read file - null');
            //         }
            //         try {
            //             //try to interpret this file as uncompressed
            //             parsed = MusicXML.parseScore(data.toString());
            //             console.log(data.toString());
            //             console.log(parsed);
            //         } catch(e){

            //             throw new Error('...');
            //         }

            //         let id = `file_${Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

            //         // Set this song as the current work in the global context
            //         setCurrentFile({type: 'set', val: {id, file_name: fileName, data: parsed}});

            //         // Fail silently if localStorage is disabled
            //         try {
                        
            //             // Set this song as the current work in localStorage
            //             localStorage.setItem(id, JSON.stringify(parsed));
            //             localStorage.setItem('current_file', id);

            //             // Add this song to the recent songs list
            //             let newRecentFiles = recentFiles.map(x => x);

            //             for (let i = 0; i < newRecentFiles.length; i++) {
            //                 if (newRecentFiles[i]['file_name'] === fileName) {
            //                     newRecentFiles.splice(i, 1);
            //                 }
            //             }

            //             newRecentFiles.unshift({file_name: fileName, date: new Date().getTime(), id});
            //             localStorage.setItem('recent_files', JSON.stringify(newRecentFiles));

            //         } catch (e) {
            //             console.error(e);
            //         }

            //         navigate('convert');
            //     } catch (e) {
            //         showError('An issue was encountered while reading the selected file.');
            //         console.error(e);
            //     }
            // };
            // reader.readAsArrayBuffer((e.target as any).files[0]);
        } catch (e) {
            showError('An issue was encountered while reading the selected file.');
            console.error(e);
        }
    };

    const onUpload = (fileName: string, parsed: ScoreTimewise)=>{
        let id = `file_${Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

        // Set this song as the current work in the global context
        setCurrentFile({type: 'set', val: {id, file_name: fileName, data: parsed}});

        // Fail silently if localStorage is disabled
        try {
            
            // Set this song as the current work in localStorage
            localStorage.setItem(id, JSON.stringify(parsed));
            localStorage.setItem('current_file', id);

            // Add this song to the recent songs list
            let newRecentFiles = recentFiles.map(x => x);

            for (let i = 0; i < newRecentFiles.length; i++) {
                if (newRecentFiles[i]['file_name'] === fileName) {
                    newRecentFiles.splice(i, 1);
                }
            }

            newRecentFiles.unshift({file_name: fileName, date: new Date().getTime(), id});
            localStorage.setItem('recent_files', JSON.stringify(newRecentFiles));

        } catch (e) {
            console.error(e);
        }

        navigate('convert');
    }

    return (
        <Frame header="SNapp">
            {recentFiles === undefined ? null : <div style={styles.container}>
                <div style={{...styles.item, flex: '1 0 auto'}} />
                <div style={{...styles.item, maxWidth: '720px'}}>
                    SNapp implements a simpler and more intuitive music notation so that
                    musicians can spend less time learning music and more time playing it!
                </div>
                {recentFiles.length === 0 ? <>
                    <div style={{...styles.item, flex: '.2 0 auto'}} />
                    <div style={styles.item}>
                        Try uploading a MusicXML file below
                    </div>
                    <div style={{...styles.item, flex: '.35 0 auto'}} />
                </> : <>
                        <div style={{...styles.item, flex: '.36 0 auto'}} />
                        <div style={{...styles.item, fontSize: '28px', fontWeight: 'bolder'}}>Recent Files</div>
                        <div style={{...styles.item, flex: '.08 0 auto'}} />
                        <div style={{...styles.item, ...styles.recentFiles}}>
                            <div style={{...styles.recentFilesInner}}>
                                {recentFiles.map(x => <Fragment key={x.id}>
                                    <div className="button-recent-file" style={styles.recentFilesItem} onClick={() => {loadFile(x);}}>
                                        <div style={{...styles.recentFilesItemInner, flex: '0 1 auto', fontWeight: 'bold'}}>
                                            {x.file_name}
                                        </div>
                                        <div style={{...styles.recentFilesItemInner, width: '10px', flex: '1 1 auto'}} />
                                        <div style={{...styles.recentFilesItemInner, flex: '0 100000 auto', fontSize: '22px'}}>
                                            {(d => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`)(new Date(x.date))}
                                        </div>
                                    </div>
                                    <div style={styles.recentFilesSeparator}></div>
                                </Fragment>)}
                            </div>
                        </div>
                        <div style={{...styles.item, flex: '.24 0 auto'}} />
                    </>}
                <div style={styles.item}>
                    <span id="button-upload" style={styles.link} onClick={() => {}}>
                        <img src={svg} style={styles.icon} alt="" />
                        Upload MusicXML File
                        <input style={styles.fileInput} type="file" title="Click to upload" accept=".musicxml,.mxl" onChange={(e) => {uploadFile(e);}}></input>
                    </span>
                </div>
                <div style={{...styles.item, flex: '1 0 auto'}} />
            </div>}
        </Frame>
    );
};

const styleMap = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    item: {
        position: 'initial',
        top: 'auto',
        left: 'auto',
        height: 'auto',
        marginLeft: '50%',
        width: '70%',
        transform: 'translate(-50%,0px)',
        textAlign: 'center',
        fontSize: '21px',
        flex: '0 0 auto',
    },
    fileInput: {
        position: 'absolute',
        top: '0px',
        left: 'calc(50% - 170px)',
        width: '340px',
        height: '100%',
        cursor: 'pointer',
        opacity: 0,
    },
    recentFiles: {
        color: '#31B7D6',
        maxWidth: '600px',
        height: '250px',
        borderRadius: '10px',
        border: '2px solid #BBBBBB',
        padding: '5px',
        overflow: 'hidden',
    },
    recentFilesInner: {
        position: 'relative',
        paddingLeft: '15px',
        paddingRight: '15px',
        overflowX: 'hidden',
        overflowY: 'auto',
    },
    recentFilesItem: {
        display: 'flex',
        width: 'calc(100% - 10px)',
        marginTop: '20px',
        marginLeft: '5px',
        marginRight: '5px',
        lineHeight: '40px',
        fontSize: '24px',
        position: 'relative',
        height: '40px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'pointer',
    },
    recentFilesSeparator: {
        position: 'relative',
        height: '2px',
        backgroundColor: '#DDDDDD',
        borderRadius: '10px',
    },
    recentFilesItemInner: {
        position: 'initial',
        width: 'auto',
        flex: '0 0 auto',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    link: {
        color: '#31B7D6',
        cursor: 'pointer',
        fontSize: '28px',
        fontWeight: 'bold',
    },
    icon: {
        height: '1em',
        width: '1em',
        position: 'relative',
        display: 'inline-flex',
        top: '.125em',
        marginRight: '.25em',
    },
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Menu;
