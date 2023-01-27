/* eslint-disable @typescript-eslint/ban-ts-comment */
import '../../assets/index.scss';
import 'virtual:windi.css';
import {Input} from './atoms/Input';
import toast from 'react-hot-toast';
import {useEffect, useRef, useState} from 'react';
import {SelectComponent} from './atoms/Select/Select';
import {Button} from './atoms/Button';
import {useDebounce} from 'usehooks-ts';
import {
  addToLocalList,
  getPlatform,
  getProcessesList,
  getToken,
  saveToken,
  setSavedList,
  getCurrentVersion,
  onUpdate,
  getOnBoot,
  toggleBoot,
  getNotFoundAction,
  saveNotFoundAction,
  onNewGame,
} from '#preload';

import debounce from 'debounce-promise';

const API_BASE = 'https://api.lestudio.qlaffont.com';

const selectOptionsNotFound = [
  {
    value: 'nothing',
    label: 'Do nothing',
  },
  {
    value: 'clear',
    label: 'Remove current category',
  },
];
const App = () => {
  const [tokenInput, setTokenInput] = useState<string>(getToken() || undefined);
  const [checkedBoot, setCheckedBoot] = useState<boolean>();
  const [process, setProcess] = useState<string>();
  const [notFoundAction, setNotFoundAction] = useState<string>(getNotFoundAction() || 'nothing');
  const [version, setVersion] = useState<string>();
  const [gameId, setGameId] = useState<string>();
  const tokenDebounced = useDebounce(tokenInput, 1000);
  const [tokenIsDisplayed, setTokenIsDisplayed] = useState<boolean>();
  const [isLoading, setIsLoading] = useState<boolean>();

  const [processes, setProcesses] = useState<
    {
      processName: string;
      windowTitle: string;
    }[]
  >([]);

  const [currentGame, setCurrentGame] = useState<{
    id: string;
    name: string;
    box_art_url: string;
    processName: string;
  }>();

  useEffect(() => {
    //Fetch indexed games
    toast.promise(
      (async () => {
        try {
          setVersion(await getCurrentVersion());
          setCheckedBoot(await getOnBoot());
          let res = await fetch(
            `https://raw.githubusercontent.com/qlaffont/igdb-twitch-process-list/main/${getPlatform()}.json`,
            {cache: 'reload'},
          );

          if (!res.ok) {
            throw new Error('Impossible to fetch');
          }

          res = await res.json();

          await setSavedList(
            res as unknown as {
              processName: string;
              windowTitle: string;
              igdbId: string;
              twitchCategoryId: string;
            }[],
          );
        } catch (error) {
          console.log(error);
          throw error;
        }
      })(),
      {
        loading: 'Fetching last games...',
        success: 'Game list updated !',
        error: 'You are running the last updated game list !',
      },
    );

    onUpdate(version => {
      toast.success(`New version (${version}) downloaded. Please restart the app !`, {
        duration: 10000,
      });
    });

    onNewGame(game => {
      setCurrentGame(game);
    });
  }, []);

  useEffect(() => {
    if (tokenDebounced && tokenDebounced.length > 0) {
      saveToken(tokenDebounced + '');

      toast.promise(
        (async () => {
          const res = await fetch(`${API_BASE}/users/valid?token=${tokenDebounced}`, {
            cache: 'reload',
          });

          if (!res.ok) {
            throw new Error('Impossible to fetch');
          }
        })(),
        {
          loading: 'Saving...',
          success: 'Token saved !',
          error: 'Your token is not valid ! (Settings > Token)',
        },
      );
    }
  }, [tokenDebounced]);

  useEffect(() => {
    //@ts-ignore
    window.fetchProcesses = async () => {
      //@ts-ignore
      setProcesses(await getProcessesList());
      //@ts-ignore
      window.savedTimeout = setTimeout(() => {
        //@ts-ignore
        window.fetchProcesses();
      }, 5000);
    };

    (async () => {
      //@ts-ignore
      window.fetchProcesses();
    })();

    return () => {
      //@ts-ignore
      clearTimeout(window.savedTimeout);
    };
  }, []);

  useEffect(() => {
    if (notFoundAction && notFoundAction.length > 0) {
      saveNotFoundAction(notFoundAction);
    }
  }, [notFoundAction]);

  const selectInputRef = useRef();

  return (
    <div className="p-5 space-y-5">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <div>
          <i className="brand bg-logo w-50 h-12 block" />
        </div>
        <div>
          Game List <span className="text-sm italic">({version})</span>
        </div>
      </h1>

      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div
            className="flex justify-center h-[147px] w-[110px] border"
            style={{
              background: currentGame?.box_art_url
                ? `url(${currentGame?.box_art_url
                    ?.replace('{width}', '110')
                    .replace('{height}', '147')})`
                : undefined,
            }}
          ></div>
          <div>
            <p className="line-clamp-1 font-bold text-2xl">
              {currentGame?.name || 'Game not detected'}
            </p>
            <p className="italic line-clamp-1 ">{currentGame?.processName || 'No process found'}</p>
          </div>
        </div>

        <div className="border" />

        <div>
          <Input
            label="User Token"
            value={tokenInput}
            type={tokenIsDisplayed ? 'text' : 'password'}
            suffixIcon={tokenIsDisplayed ? 'icon icon-eye-full' : 'icon icon-eye'}
            onClick={() => setTokenIsDisplayed(v => !v)}
            onChange={evt => setTokenInput(evt?.target?.value)}
          />
        </div>

        <div>
          <SelectComponent
            label="If Game not found :"
            value={notFoundAction}
            onChange={evt => setNotFoundAction(evt?.value || 'nothing')}
            options={selectOptionsNotFound}
            isSearchable
            isClearable
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="pt-1">
            <input
              type="checkbox"
              checked={checkedBoot}
              onChange={() => {
                setCheckedBoot(v => !v);
                toggleBoot();
              }}
            />
          </div>
          <div>
            <p>Start on boot</p>
          </div>
        </div>

        <div className="border" />

        <div className="space-y-3">
          <h2 className="font-xl font-bold">Add game to list</h2>

          {isLoading ? (
            <div className="flex items-center justify-center gap-1">
              <div>
                <p className="text-center font-bold italic text-sm">Added game in progress...</p>
              </div>
              <div>
                <i className="icon icon-refresh animate bg-white h-4 w-4 block"></i>
              </div>
            </div>
          ) : (
            <>
              <SelectComponent
                label="Processes"
                value={process}
                onChange={evt => setProcess(evt?.value)}
                options={processes.map(({processName, windowTitle}) => ({
                  label: `${processName} (${windowTitle})`,
                  value: processName,
                }))}
                isClearable
                disabled={tokenInput?.length === 0}
                selectRef={selectInputRef}
              />

              <SelectComponent
                label="Twitch Game / Category"
                value={gameId}
                onChange={evt => setGameId(evt?.value)}
                isClearable
                async
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                loadOptions={debounce(async inputValue => {
                  if (inputValue?.length > 3) {
                    const res = await fetch(
                      `${API_BASE}/twitch/games?search=${inputValue}&token=${tokenDebounced}`,
                      {cache: 'reload'},
                    );

                    const games = (await res.json()).data.getTwitchGames;

                    return games?.map(v => ({value: v.id, label: v.name}));
                  }
                }, 500)}
                disabled={
                  !tokenInput || tokenInput?.length === 0 || !process || process?.length === 0
                }
              />

              <Button
                className="mx-auto"
                isLoading={isLoading}
                disabled={
                  !gameId ||
                  gameId?.length === 0 ||
                  !tokenInput ||
                  tokenInput?.length === 0 ||
                  !process ||
                  process?.length === 0
                }
                onClick={async () => {
                  setIsLoading(true);

                  try {
                    const url = new URL('/twitch/games', API_BASE);
                    url.searchParams.append('token', tokenDebounced);
                    url.searchParams.append('twitchCategoryId', gameId);
                    url.searchParams.append('processName', process);
                    url.searchParams.append(
                      'windowTitle',
                      processes?.find(v => v.processName === process)?.windowTitle,
                    );
                    url.searchParams.append('platform', getPlatform());
                    if (processes?.find(v => v.processName === process)?.processName) {
                      await fetch(url.toString(), {method: 'PUT'});
                    } else {
                      console.log('process not found anymore');
                    }
                    // eslint-disable-next-line no-empty
                  } catch (error) {
                    console.log(error);
                  }

                  await addToLocalList({
                    processName: process,
                    windowTitle: processes?.find(v => v.processName === process)?.windowTitle,
                    twitchCategoryId: gameId,
                    igdbId: '',
                  });

                  // setList([
                  //   ...getLocalList(),
                  //   ...getSavedList(),
                  //   {
                  //     processName: process,
                  //     windowTitle: processes?.find(v => v.processName === process)?.windowTitle,
                  //     twitchCategoryId: gameId,
                  //     igdbId: '',
                  //   },
                  // ]);

                  setProcess(null);
                  setGameId(null);

                  setTimeout(() => {
                    setIsLoading(false);
                  }, 1000);
                }}
              >
                Submit
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
