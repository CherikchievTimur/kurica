document.getElementById("addPlayer").addEventListener("click", function () {
  const playersDiv = document.getElementById("players");
  const numPlayers = playersDiv.children.length;

  const newPlayerDiv = document.createElement("div");
  const label = document.createElement("label");
  label.setAttribute("for", `player${numPlayers + 1}`);
  label.textContent = `Player ${numPlayers + 1}:`;

  const input = document.createElement("input");
  input.setAttribute("type", "text");
  input.setAttribute("id", `player${numPlayers + 1}`);
  input.setAttribute("placeholder", "Enter name");

  newPlayerDiv.appendChild(label);
  newPlayerDiv.appendChild(input);
  playersDiv.appendChild(newPlayerDiv);

  if (numPlayers >= 2) {
    const minusButton = document.createElement("button");
    minusButton.classList.add("minusButton");
    minusButton.textContent = "-";
    minusButton.addEventListener("click", function () {
      playersDiv.removeChild(newPlayerDiv);
    });
    newPlayerDiv.appendChild(minusButton);
  }
});
