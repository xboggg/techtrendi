-- Rollback of 20261111_ei_tech_reactions.sql (removes all Ei Tech! laughs and votes too).
drop function if exists techtrendi.ei_tech_react(text, text, text, text);
drop function if exists techtrendi.ei_tech_counts(text[]);
drop table if exists techtrendi.ei_tech_reactions;
notify pgrst, 'reload schema';
