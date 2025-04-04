import { useEffect, useLayoutEffect, useRef, useState } from "react";

function App() {
  const [elements, setelements] = useState([{}]);
  const [eraser, seteraser] = useState(false);
  const [isdrawing, setisdrawing] = useState(false);

  const [currentdraw, setcurrentdraw] = useState(1);
  const [panning, setpanning] = useState(false);
  const [panoffset, setpanoffset] = useState([0, 0, 0, 0, 0, 0]);

  const [strokew, setstrokew] = useState(5);
  const [filled, setfilled] = useState(false);
  const [selected, setselected] = useState(null);
  const [textBox, settextBox] = useState(null);
  const [currentcolor, setcurrentcolor] = useState("#ffffff");
  const textarearef = useRef();
  const [zoomval, setzoomval] = useState(1);
  const [scaledOffset, setscaledOffset] = useState({ x: 0, y: 0 });
  const [textval, settextval] = useState("");

  function isPointOnLine(x, y, x1, y1, x2, y2, tolerance = 10) {
    const ABx = x2 - x1;
    const ABy = y2 - y1;
    const APx = x - x1;
    const APy = y - y1;

    const dotProduct = ABx * APx + ABy * APy;

    const ABMagSquared = ABx * ABx + ABy * ABy;
    const t = dotProduct / ABMagSquared;

    const closestX = x1 + t * ABx;
    const closestY = y1 + t * ABy;

    const withinBounds =
      Math.min(x1, x2) - tolerance <= x &&
      x <= Math.max(x1, x2) + tolerance &&
      Math.min(y1, y2) - tolerance <= y &&
      y <= Math.max(y1, y2) + tolerance;

    const distanceSquared =
      (x - closestX) * (x - closestX) + (y - closestY) * (y - closestY);
    const isOnSegment = distanceSquared < tolerance * tolerance;

    return withinBounds && isOnSegment;
  }

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scaledWidth = canvas.width * zoomval;
    const scaledHeight = canvas.height * zoomval;
    const scaledOffsetX = (scaledWidth - canvas.width) / 2;
    const scaledOffsetY = (scaledHeight - canvas.height) / 2;
    setscaledOffset({ x: scaledOffsetX, y: scaledOffsetY });

    ctx.translate(
      -scaledOffsetX + panoffset[2] * zoomval,
      -scaledOffsetY + panoffset[3] * zoomval
    );
    ctx.scale(zoomval, zoomval);

    if (elements.length <= 0) {
      return;
    }

    elements.forEach((element) => {
      ctx.save();
      // ctx.setTransform(1, 0, 0, 1, 0, 0);
      // ctx.translate(panoffset[2], panoffset[3]);

      if (element.selected) {
        ctx.setLineDash([
          Math.floor(Math.random() * (6 - 4 + 1)) + 4,
          Math.floor(Math.random() * (6 - 4 + 1)) + 4,
        ]);
      } else {
        ctx.setLineDash([]);
      }
      if (element.isfilled) {
        ctx.fillStyle = element.color;
      } else {
        ctx.strokeStyle = element.color;

        ctx.lineWidth = element.stroke;
      }

      ctx.beginPath();

      if (element.id == 1 || element.id == 2) {
        for (let i = 0; i < element.points.length; i++) {
          if (i == 0) {
            ctx.moveTo(element.points[i][0], element.points[i][1]);
          } else {
            ctx.lineTo(element.points[i][0], element.points[i][1]);
          }
        }
      } else if (element.id == 3) {
        if (element.points.length != 2) {
          return;
        }
        ctx.rect(
          element.points[0][0],
          element.points[0][1],
          element.points[1][0] - element.points[0][0],
          element.points[1][1] - element.points[0][1]
        );
      } else if (element.id == 4) {
        if (element.points.length != 2) {
          return;
        }
        const [x1, y1] = element.points[0];
        const [x2, y2] = element.points[1];
        const slope = (y2 - y1) / (x2 - x1);
        ctx.ellipse(
          x1,
          y1,
          Math.abs(x2 - x1),
          Math.abs(y2 - y1),
          0,
          2 * Math.PI,
          false
        );
      }
      if (element.isfilled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }

      if (element.id == 6) {
        ctx.fillStyle = element.color;
        ctx.font = `${element.stroke * 3}px Arial`;
        const lines = element.text.split("\n");
        let x = element.points[0];
        let y = element.points[1];

        lines.forEach((line) => {
          ctx.fillText(line, x, y);
          y += element.stroke * 3;
        });
      }

      ctx.restore();
    });
  }, [elements, panoffset, zoomval]);

  const findelementat = (x, y) => {
    for (let i = 0; i < elements.length; i++) {
      let element = elements[i];
      if (element.id == 2) {
        if (element.points.length > 1) {
          const [x1, y1] = element.points[0];
          const [x2, y2] = element.points[1];

          if (isPointOnLine(x, y, x1, y1, x2, y2)) {
            setselected([x - x1, y - y1, i, 1]);
          }
        }
      } else if (element.id == 3 || element.id == 4) {
        const [x1, y1] = element.points[0];
        const [x2, y2] = element.points[1];
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
          setselected([x - x1, y - y1, i, 1]);
        }
      } else if (element.id == 1) {
        for (let j = 0; j < element.points.length; j++) {
          if (
            Math.abs(element.points[j][0] - x) < 5 &&
            Math.abs(element.points[j][1] - y) < 8
          ) {
            setselected([x, y, i, 2]);

            break;
          }
        }
      } else if (element.id == 6) {
        const [x1, y1] = element.points;

        const ctx1 = document.getElementById("canvas").getContext("2d");
        ctx1.font = `${element.stroke * 3}px Arial`;

        var longest = element.text.split("\n").sort(function (a, b) {
          return b.length - a.length;
        })[0];

        const y2 = y1 + element.stroke * 3 * element.text.split("\n").length;
        const text = ctx1.measureText(longest);
        const x2 = x1 + text.width;

        if (x >= x1 && x <= x2 && y >= y1 - 15 && y <= y2 - 10) {
          setselected([x, y, i, 3]);
        }
      }
    }
  };

  useEffect(() => {
    if (selected) {
      setelements((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          let i = selected[2];
          updated[i].selected = true;
        }
        return updated;
      });
    }
  }, [selected]);

  const findelementat1 = (x, y, z) => {
    for (let i = 0; i < elements.length; i++) {
      let element = elements[i];
      if (element.id == 2) {
        if (element.points.length > 1) {
          const [x1, y1] = element.points[0];
          const [x2, y2] = element.points[1];

          if (isPointOnLine(x, y, x1, y1, x2, y2)) {
            if (z) {
              return i;
            }
            return true;
          }
        }
      } else if (element.id == 3 || element.id == 4) {
        const [x1, y1] = element.points[0];
        const [x2, y2] = element.points[1];
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
          if (z) {
            return i;
          }
          return true;
        }
      } else if (element.id == 1) {
        for (let j = 0; j < element.points.length; j++) {
          if (
            Math.abs(element.points[j][0] - x) < 5 &&
            Math.abs(element.points[j][1] - y) < 8
          ) {
            if (z) {
              return i;
            }
            return true;
          }
        }
      } else if (element.id == 6) {
        const [x1, y1] = element.points;

        const ctx1 = document.getElementById("canvas").getContext("2d");
        ctx1.font = `${element.stroke * 3}px Arial`;

        var longest = element.text.split("\n").sort(function (a, b) {
          return b.length - a.length;
        })[0];

        const y2 = y1 + element.stroke * 3 * element.text.split("\n").length;
        const text = ctx1.measureText(longest);
        const x2 = x1 + text.width;

        if (x >= x1 && x <= x2 && y >= y1 - 15 && y <= y2 - 10) {
          if (z) {
            return i;
          }
          return true;
        }
      }
    }
    if (z) {
      return -1;
    }
    return false;
  };

  function getMousevalues(e) {
    let epx = (e.clientX - panoffset[2] * zoomval + scaledOffset.x) / zoomval;
    let epy = (e.clientY - panoffset[3] * zoomval + scaledOffset.y) / zoomval;
    return [epx, epy];
  }

  const [elementadd, setelementadd] = useState(false);

  const handleMousedown = (e) => {
    setelementadd(true);

    let [epx, epy] = getMousevalues(e);

    if (currentdraw == 7) {
      seteraser(true);
    } else if (currentdraw == 8) {
      setpanning(true);
      setpanoffset((prev) => [epx, epy, prev[2], prev[3], prev[4], prev[5]]);
    }
    if (currentdraw == 5 && !selected) {
      findelementat(epx, epy);
    } else if (selected) {
      setelements((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          let i = selected[2];
          updated[i].selected = false;
        }
        return updated;
      });

      setselected(null);
    }

    setisdrawing(true);

    setelements((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        if (Object.keys(updated[updated.length - 1]).length !== 0) {
          return [...updated, {}];
        }
      }

      return updated;
    });
  };

  const handleMouseup = (e) => {
    setelementadd(false);

    setisdrawing(false);
    setpanoffset((prev) => [
      prev[0],
      prev[1],
      prev[2],
      prev[3],
      prev[2],
      prev[3],
    ]);
    let [epx, epy] = getMousevalues(e);
    setpanning(false);
    seteraser(false);

    if (currentdraw == 6) {
      if (textBox) {
        settextBox(null);
      } else {
        settextBox([epx, epy, e.clientX, e.clientY]);
      }
    }
  };

  const handleMousemove = (e) => {
    let [epx, epy] = getMousevalues(e);

    if (eraser) {
      const trail = document.createElement("div");
      trail.className = "trail";
      document.body.appendChild(trail);
      trail.style.left = `${e.pageX}px`;
      trail.style.top = `${e.pageY}px`;
      setTimeout(() => {
        trail.style.opacity = "0";
        setTimeout(() => {
          trail.remove();
        }, 10);
      }, 100);

      let elm = findelementat1(epx, epy, 1);
      if (elm >= 0) {
        setelements((prevArray) => prevArray.filter((_, i) => i !== elm));
      }
    }
    if (!isdrawing && currentdraw != 5) return;

    if (currentdraw === 1) {
      setelements((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          if (Object.keys(updated[updated.length - 1]).length === 0) {
            updated[updated.length - 1] = {
              id: 1,
              selected: false,
              stroke: strokew,
              color: currentcolor,
              points: [[epx, epy]],
            };
          } else {
            updated[updated.length - 1].points = [
              ...updated[updated.length - 1].points,
              [epx, epy],
            ];
          }
        }
        return updated;
      });
    } else if (currentdraw === 2 || currentdraw === 3 || currentdraw === 4) {
      setelements((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          if (Object.keys(updated[updated.length - 1]).length === 0) {
            updated[updated.length - 1] = {
              id: currentdraw,
              selected: false,
              stroke: strokew,
              isfilled: filled,
              color: currentcolor,
              points: [[epx, epy]],
            };
          } else {
            updated[updated.length - 1].points = [
              updated[updated.length - 1].points[0],
              [epx, epy],
            ];
          }
        }
        return updated;
      });
    }

    if (currentdraw === 5 && selected) {
      if (selected[3] == 1) {
        document.getElementById("canvas").style.cursor = "move";
        setelements((prev) => {
          const updated = [...prev];
          let i = selected[2];

          let changex = updated[i].points[0][0] - updated[i].points[1][0];
          let changey = updated[i].points[0][1] - updated[i].points[1][1];
          let xp = epx - selected[0];
          let yp = epy - selected[1];

          updated[i].points = [
            [xp, yp],
            [xp + changex, yp + changey],
          ];

          return updated;
        });
      } else if (selected[3] === 2) {
        document.getElementById("canvas").style.cursor = "move";
        setelements((prev) => {
          const updated = [...prev];
          let i = selected[2];

          let changex = selected[0] - epx;
          let changey = selected[1] - epy;

          for (let j = 0; j < updated[i].points.length; j++) {
            updated[i].points[j][0] -= changex;
            updated[i].points[j][1] -= changey;
          }
          setselected([epx, epy, i, 2]);

          return updated;
        });
      } else if (selected[3] == 3) {
        document.getElementById("canvas").style.cursor = "move";
        setelements((prev) => {
          const updated = [...prev];
          let i = selected[2];

          updated[i].points[0] = selected[0];
          updated[i].points[1] = selected[1];

          setselected([epx, epy, i, 3]);

          return updated;
        });
      }
    } else if (currentdraw == 5) {
      if (findelementat1(epx, epy)) {
        document.getElementById("canvas").style.cursor = "move";
      } else {
        document.getElementById("canvas").style.cursor = "";
      }
    }
  };

  useEffect(() => {
    if (currentdraw < 5) {
      document.getElementById("canvas").style.cursor = "crosshair";
    } else if (currentdraw == 6) {
      document.getElementById("canvas").style.cursor = "";
    } else if (currentdraw == 7) {
      document.getElementById("canvas").style.cursor =
        "url('https://i.postimg.cc/sxR1L415/eraser1.png'),auto";
    } else if (currentdraw == 8) {
      document.getElementById("canvas").style.cursor = "grab";
    }
    if (currentdraw == 3 || currentdraw == 4) {
      document.getElementById("filleddiv").classList.remove("hidden");
    } else {
      setfilled(false);
      document.getElementById("filleddiv").classList.add("hidden");
    }
    let buttons = document.getElementsByClassName("btnn");
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove("active");
    }
    document.getElementById("btn" + currentdraw).classList.add("active");
  }, [currentdraw]);

  const handleblur = () => {
    if (textval) {
      setelements((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          if (Object.keys(updated[updated.length - 1]).length === 0) {
            updated[updated.length - 1] = {
              id: currentdraw,
              stroke: strokew,
              color: currentcolor,
              points: [textBox[0], textBox[1] + 15],
              text: textval,
            };
          }
        }
        return updated;
      });
    }
    settextval(null);
  };

  useEffect(() => {
    if (textBox) {
      const textA = textarearef.current;
      if (currentdraw == 6) textA.focus();
    }
  }, [textBox]);

  useEffect(() => {
    const panFunction = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        setzoomval((prev) => {
          if (prev - e.deltaY / 200 > 0.1 && prev - e.deltaY / 200 < 4) {
            return prev - e.deltaY / 200;
          }
          return prev;
        });
      } else {
        setpanoffset((prev) => [
          prev[0],
          prev[1],
          prev[2] + (prev[0] - e.deltaX),
          prev[3] + (prev[1] - e.deltaY),
          prev[4],
          prev[5],
        ]);
      }
    };
    const shortcuts = (e) => {
      if (e.target.tagName != "TEXTAREA" && e.target.tagName == "BODY") {
        if (e.key == 1) setcurrentdraw(5);
        else if (e.key == 2) setcurrentdraw(1);
        else if (e.key == 3) setcurrentdraw(2);
        else if (e.key == 4) setcurrentdraw(3);
        else if (e.key == 5) setcurrentdraw(4);
        else if (e.key == 6) setcurrentdraw(6);
        else if (e.key == 7) setcurrentdraw(8);
        else if (e.key == 8) setelements([{}]);
      }
    };
    document.addEventListener("keypress", shortcuts);
    window.addEventListener("wheel", panFunction, { passive: false });
    return () => {
      document.removeEventListener("keypress", shortcuts);
      window.removeEventListener("wheel", panFunction);
    };
  }, []);

  return (
    <>
      <canvas
        style={{ position: "absolute", zIndex: -100 }}
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMousedown}
        onMouseUp={handleMouseup}
        onMouseMove={handleMousemove}
      ></canvas>
      <div className="popup" style={{ zIndex: 100 }}>
        {" "}
        This Website only works with laptop/computers!
      </div>

      <div className=" flex justify-center " style={{ zIndex: 5 }}>
        <div
          className="   flex items-center border toolkit gap-1"
          style={{ zIndex: 5 }}
        >
          {/* select */}

          <button
            id="btn5"
            className=" btnn"
            title="Select"
            onClick={() => {
              setcurrentdraw(5);
            }}
          >
            <div className="flex text-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-cursor-fill"
                viewBox="0 0 16 16"
              >
                <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
              </svg>
              <span style={{ fontSize: "12px" }}>
                {" "}
                <sub>1</sub>
              </span>
            </div>
          </button>

          {/* pencil */}
          <button
            id="btn1"
            className="active btnn"
            title="Pencil"
            onClick={() => {
              setcurrentdraw(1);
            }}
          >
            <div className="flex text-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-pencil-fill"
                viewBox="0 0 16 16"
              >
                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z" />
              </svg>

              <span style={{ fontSize: "12px" }}>
                {" "}
                <sub>2</sub>
              </span>
            </div>
          </button>

          {/* line */}
          <button
            id="btn2"
            className=" btnn"
            title="Line"
            onClick={() => {
              setcurrentdraw(2);
            }}
          >
            <sup>\</sup>{" "}
            <span style={{ fontSize: "12px" }}>
              {" "}
              <sub>3</sub>
            </span>
          </button>

          {/* square */}
          <button
            id="btn3"
            className=" btnn"
            title="Square"
            onClick={() => {
              setcurrentdraw(3);
            }}
          >
            <div className="flex text-xl">
              {filled ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-square-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-square"
                  viewBox="0 0 16 16"
                >
                  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                </svg>
              )}

              <span style={{ fontSize: "12px" }}>
                {" "}
                <sub>4</sub>
              </span>
            </div>
          </button>

          {/* circle */}
          <button
            id="btn4"
            className=" btnn"
            title="Circle"
            onClick={() => {
              setcurrentdraw(4);
            }}
          >
            <div className="flex text-xl">
              {filled ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-circle-fill"
                  viewBox="0 0 16 16"
                >
                  <circle cx="8" cy="8" r="8" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-circle"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                </svg>
              )}

              <span style={{ fontSize: "12px" }}>
                {" "}
                <sub>5</sub>
              </span>
            </div>
          </button>

          {/* text */}
          <button
            id="btn6"
            className=" btnn"
            title="Text"
            onClick={() => {
              setcurrentdraw(6);
            }}
          >
            A
            <span style={{ fontSize: "12px" }}>
              {" "}
              <sub>6</sub>
            </span>
          </button>
          {/* Eraser */}
          <button
            id="btn7"
            className=" btnn"
            title="Eraser"
            onClick={() => {
              setcurrentdraw(7);
            }}
          >
            <div className="flex text-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-eraser-fill"
                viewBox="0 0 16 16"
              >
                <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z" />
              </svg>

              <span style={{ fontSize: "12px" }}>
                {" "}
                <sub>7</sub>
              </span>
            </div>
          </button>

          <button
            className=" btnn"
            title="Clear"
            onClick={() => {
              setelements([{}]);
            }}
          >
            <div className="flex text-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-trash3"
                viewBox="0 0 16 16"
              >
                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
              </svg>

              <span style={{ fontSize: "12px" }}>
                {" "}
                <sub>8</sub>
              </span>
            </div>
          </button>

          {currentdraw == 6 && textBox ? (
            <textarea
              rows={textval ? textval.split("\n").length + 2 : 3}
              style={{
                position: "fixed",
                resize: "none",
                top: textBox[3],
                left: textBox[2],
                border: 0,
                color: currentcolor,
                boxShadow: "none",
                font: `${strokew * 3 * zoomval}px Arial`,
                background: "rgba(0, 0, 0, 0)",
              }}
              onBlur={handleblur}
              ref={textarearef}
              value={textval}
              onChange={(e) => {
                settextval(e.currentTarget.value);
              }}
            ></textarea>
          ) : null}

          <div>
            <input
              type="color"
              value={currentcolor}
              onChange={(e) => {
                setcurrentcolor(e.currentTarget.value);
              }}
            />
          </div>

          <div className="ml-5 mr-5">
            <p className="text-sm m-0"> Size:- {strokew}</p>
            <p className="text-sm m-0">
              <input
                type="range"
                name=""
                id=""
                min={1}
                max={20}
                value={strokew}
                onChange={(e) => {
                  setstrokew(parseInt(e.currentTarget.value));
                }}
              />
            </p>
          </div>

          <div className="hidden mr-5" id="filleddiv">
            <p>
              {" "}
              <input
                type="checkbox"
                name="filled"
                checked={filled}
                onChange={(e) => {
                  setfilled(e.currentTarget.checked);
                }}
              />{" "}
              Fill{" "}
            </p>
          </div>
        </div>

        <div className="zoomkit" style={{ zIndex: 5 }}>
          <button
            className="zm"
            onClick={() => {
              if (zoomval < 4) setzoomval((prev) => prev + 0.1);
            }}
          >
            +
          </button>
          {Math.floor(zoomval * 100)}%
          <button
            className="zm"
            onClick={() => {
              if (zoomval > 0.2) setzoomval((prev) => prev - 0.1);
            }}
          >
            -
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
