import React from "react";
import {
  Card,
  CardPrimaryAction,
  CardMedia,
  CardAction,
  CardActions,
  CardActionButtons
} from "@rmwc/card";
import { Typography } from "@rmwc/typography";
import { Grid, GridCell } from "@rmwc/grid";

const GameList = ({ games, onDelete }) => (
  <Grid>
    {games.map(({ Title }, index) => (
      <GridCell span="4" key={Title}>
        <Card style={{ width: "12rem" }}>
          <CardMedia
            square
            style={{
              backgroundImage:
                "url(https://material-components-web.appspot.com/images/16-9.jpg)"
            }}
          />
          <div style={{ padding: "0 1rem 1rem 1rem" }}>
            <Typography use="headline6" tag="h2">
              {Title}
            </Typography>
          </div>

          <CardActions>
            <CardActionButtons>
              <CardAction icon="delete_outline" onClick={onDelete(index + 1)} />
            </CardActionButtons>
          </CardActions>
        </Card>
      </GridCell>
    ))}
  </Grid>
);

export default GameList;
